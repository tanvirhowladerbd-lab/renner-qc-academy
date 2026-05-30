Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Tanvir\Office_AI"
WshShell.Run """C:\Program Files\nodejs\node.exe"" gateway.js", 0, false
WshShell.Run """C:\Program Files\nodejs\node.exe"" server.js", 0, false
WshShell.CurrentDirectory = "C:\Users\Tanvir\Office_AI\client"
WshShell.Run """C:\Program Files\nodejs\npm.cmd"" run dev", 0, false
