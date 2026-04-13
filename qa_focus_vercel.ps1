Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class Win {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr p);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder sb, int n);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  public static List<IntPtr> wins = new List<IntPtr>();
  public static List<string> titles = new List<string>();
  public static bool Cb(IntPtr h, IntPtr p) {
    if (!IsWindowVisible(h)) return true;
    int len = GetWindowTextLength(h);
    if (len == 0) return true;
    StringBuilder sb = new StringBuilder(len + 1);
    GetWindowText(h, sb, len + 1);
    wins.Add(h);
    titles.Add(sb.ToString());
    return true;
  }
}
"@

[Win]::wins.Clear()
[Win]::titles.Clear()
[Win]::EnumWindows([Win+EnumWindowsProc]{ param($h, $p) [Win]::Cb($h, $p) }, [IntPtr]::Zero) | Out-Null

$log = "C:\Users\Desktop\Desktop\Egitim_Check\qa_focus_vercel.log"
"--- all visible windows ---" | Out-File $log -Encoding utf8
for ($i = 0; $i -lt [Win]::titles.Count; $i++) {
  "$($i): $([Win]::titles[$i])" | Out-File $log -Encoding utf8 -Append
}

$idx = -1
for ($i = 0; $i -lt [Win]::titles.Count; $i++) {
  if ([Win]::titles[$i] -like '*Vercel*' -or [Win]::titles[$i] -like '*egitim-checkup*' -or [Win]::titles[$i] -like '*Supabase*') {
    $idx = $i; break
  }
}

if ($idx -ge 0) {
  $h = [Win]::wins[$idx]
  [Win]::ShowWindowAsync($h, 9) | Out-Null
  Start-Sleep -Milliseconds 300
  [Win]::SetForegroundWindow($h) | Out-Null
  "activated[$idx]: $([Win]::titles[$idx])" | Out-File $log -Encoding utf8 -Append
} else {
  "NO VERCEL WINDOW FOUND" | Out-File $log -Encoding utf8 -Append
}
