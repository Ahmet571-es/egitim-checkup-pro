'use client';

import React from 'react';
import HomeActions from '@/components/parent/HomeActions';
import AnonymousComparison from '@/components/parent/AnonymousComparison';
import TeacherNote from '@/components/parent/TeacherNote';
import OnboardingWizard from '@/components/parent/OnboardingWizard';

interface ParentFaz4SectionProps {
  parentId: string;
  parentName: string;
  childIds: string[];
}

export default function ParentFaz4Section({ parentId, parentName, childIds }: ParentFaz4SectionProps) {
  if (childIds.length === 0) return null;

  const firstChildId = childIds[0];

  return (
    <>
      {/* Onboarding Wizard — ilk girişte göster */}
      <OnboardingWizard userId={parentId} userName={parentName} />

      {/* Evde Ne Yapabilirim */}
      <div className="mt-6">
        <HomeActions childId={firstChildId} />
      </div>

      {/* Anonim Sınıf Karşılaştırma */}
      <div className="mt-6">
        <AnonymousComparison childId={firstChildId} />
      </div>

      {/* Öğretmene Not */}
      <div className="mt-6">
        <TeacherNote parentId={parentId} childId={firstChildId} />
      </div>
    </>
  );
}
