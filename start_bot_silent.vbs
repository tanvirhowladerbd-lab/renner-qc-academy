Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Tanvir\Office_AI"
WshShell.Run """C:\Program Files\nodejs\node.exe"" gateway.js", 0, false
