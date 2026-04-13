Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d " & WshShell.ExpandEnvironmentStrings("%USERPROFILE%") & "\Desktop\Egitim_Check && faz3_push.bat", 1, True
