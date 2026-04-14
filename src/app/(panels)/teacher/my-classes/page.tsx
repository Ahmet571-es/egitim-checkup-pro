'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users, Trash2, X, Search, UserPlus, BookOpen, ChevronDown } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  grade: number | null;
  section: string;
  student_count: number;
}

interface StudentItem {
  id: string;
  full_name: string;
  email: string;
  grade: string | null;
}

export default function TeacherMyClassesPage() {
  const supabase = createClient();

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newSection, setNewSection] = useState('');
  const [creating, setCreating] = useState(false);

  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadClasses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setTeacherId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();
    setSchoolId(profile?.school_id ?? null);

    const { data: cls } = await supabase
      .from('classes')
      .select('id, name, grade, section')
      .eq('teacher_id', user.id)
      .order('name');

    const classesWithCount: ClassItem[] = [];
    for (const c of (cls ?? [])) {
      const { count } = await supabase
        .from('class_students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', c.id);
      classesWithCount.push({ ...c, student_count: count ?? 0 });
    }
    setClasses(classesWithCount);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const handleCreateClass = async () => {
    if (!teacherId || !newName.trim()) {
      setMessage({ type: 'error', text: 'Sınıf adı boş olamaz.' });
      return;
    }
    setCreating(true);
    setMessage(null);

    const insertData: Record<string, unknown> = {
      name: newName.trim(),
      grade: newGrade ? parseInt(newGrade) : null,
      section: newSection.trim(),
      teacher_id: teacherId,
    };
    if (schoolId) insertData.school_id = schoolId;

    const { error } = await supabase.from('classes').insert(insertData);

    if (error) {
      setMessage({ type: 'error', text: `Hata: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `"${newName.trim()}" sınıfı oluşturuldu!` });
      setNewName(''); setNewGrade(''); setNewSection(''); setShowCreate(false);
      await loadClasses();
    }
    setCreating(false);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`"${className}" sınıfını silmek istediğinize emin misiniz?`)) return;
    await supabase.from('class_students').delete().eq('class_id', classId);
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) {
      setMessage({ type: 'error', text: `Silme hatası: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `"${className}" silindi.` });
      setExpandedClass(null);
      await loadClasses();
    }
  };

  const loadClassStudents = async (classId: string) => {
    if (expandedClass === classId) { setExpandedClass(null); return; }
    setExpandedClass(classId);
    setShowAddStudent(false);

    const { data } = await supabase
      .from('class_students')
      .select('student_id, profiles!class_students_student_id_fkey(id, full_name, email, grade)')
      .eq('class_id', classId);

    setClassStudents(
      (data ?? []).map(d => d.profiles as unknown as StudentItem).filter(Boolean)
    );
  };

  const loadAllStudents = async () => {
    setShowAddStudent(true);
    setStudentSearch('');
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, grade')
      .eq('role', 'student')
      .order('full_name');
    setAllStudents(data ?? []);
  };

  const handleAddStudent = async (studentId: string) => {
    if (!expandedClass) return;
    setAddingStudent(true);
    if (classStudents.find(s => s.id === studentId)) {
      setMessage({ type: 'error', text: 'Bu öğrenci zaten bu sınıfta.' });
      setAddingStudent(false);
      return;
    }
    const { error } = await supabase.from('class_students').insert({ class_id: expandedClass, student_id: studentId });
    if (error) {
      setMessage({ type: 'error', text: `Atama hatası: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Öğrenci sınıfa eklendi!' });
      const tmp = expandedClass;
      await loadClassStudents(tmp);
      await loadClasses();
      setExpandedClass(tmp);
    }
    setAddingStudent(false);
  };

  const handleRemoveStudent = async (studentId: string, name: string) => {
    if (!expandedClass || !confirm(`"${name}" öğrencisini çıkarmak istediğinize emin misiniz?`)) return;
    await supabase.from('class_students').delete().eq('class_id', expandedClass).eq('student_id', studentId);
    setMessage({ type: 'success', text: `"${name}" çıkarıldı.` });
    const tmp = expandedClass;
    await loadClassStudents(tmp);
    await loadClasses();
    setExpandedClass(tmp);
  };

  const filteredStudents = allStudents.filter(s =>
    !studentSearch ||
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847] mb-1">Sınıflarım</h1>
          <p className="text-gray-500 text-sm">Sınıf oluşturun, öğrencilerinizi atayın ve yönetin.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow">
          <Plus size={16} /> Yeni Sınıf
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {showCreate && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-[#0f2847] mb-4 flex items-center gap-2"><BookOpen size={18} /> Yeni Sınıf Oluştur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Sınıf Adı *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Örn: 9-A" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Sınıf Düzeyi</label>
              <select value={newGrade} onChange={e => setNewGrade(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Seçiniz</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}. Sınıf</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Şube</label>
              <input type="text" value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="Örn: A, B, C" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateClass} disabled={creating || !newName.trim()} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50">
              {creating ? 'Oluşturuluyor...' : 'Sınıf Oluştur'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all">İptal</button>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 font-semibold">Henüz sınıfınız yok.</p>
          <p className="text-gray-400 text-sm mt-2">Yukarıdaki &quot;Yeni Sınıf&quot; butonuna tıklayarak ilk sınıfınızı oluşturun.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => loadClassStudents(cls.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><BookOpen size={18} className="text-emerald-600" /></div>
                  <div>
                    <h3 className="font-bold text-[#0f2847]">{cls.name}</h3>
                    <p className="text-gray-400 text-xs">{cls.grade ? `${cls.grade}. Sınıf` : ''} {cls.section ? `/ ${cls.section}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold"><Users size={13} /> {cls.student_count} öğrenci</span>
                  <button onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Sınıfı sil"><Trash2 size={15} /></button>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedClass === cls.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedClass === cls.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {classStudents.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {classStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-[#0f2847]">{s.full_name}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                          <button onClick={() => handleRemoveStudent(s.id, s.full_name)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-red-500 text-xs hover:bg-red-50 transition-all"><X size={12} /> Çıkar</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mb-4">Bu sınıfta henüz öğrenci yok.</p>
                  )}

                  {!showAddStudent ? (
                    <button onClick={loadAllStudents} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f2847] text-white text-sm font-semibold hover:bg-[#1a3d6e] transition-all"><UserPlus size={14} /> Öğrenci Ekle</button>
                  ) : (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="relative mb-3">
                        <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Öğrenci adı veya e-posta ile ara..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" autoFocus />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredStudents.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-3">Öğrenci bulunamadı.</p>
                        ) : (
                          filteredStudents.slice(0, 20).map(s => {
                            const alreadyAdded = classStudents.some(cs => cs.id === s.id);
                            return (
                              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                                <div>
                                  <p className="text-sm font-medium text-[#0f2847]">{s.full_name}</p>
                                  <p className="text-xs text-gray-400">{s.email} {s.grade ? `· ${s.grade}. Sınıf` : ''}</p>
                                </div>
                                {alreadyAdded ? (
                                  <span className="text-xs text-emerald-600 font-semibold">✓ Atandı</span>
                                ) : (
                                  <button onClick={() => handleAddStudent(s.id)} disabled={addingStudent} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50"><Plus size={12} /> Ekle</button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      <button onClick={() => setShowAddStudent(false)} className="mt-3 text-sm text-gray-500 hover:text-gray-700">← Kapat</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
