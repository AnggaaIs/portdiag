Output demos/portdiag.gif
Output demos/portdiag.mp4

Set Width 1920
Set Height 1080
Set FontSize 28
Set TypingSpeed 45ms
Set Padding 48
Set WindowBar Colorful
Set WindowBarSize 36
Set Theme { "name": "Portdiag", "black": "#14151a", "red": "#ff6b78", "green": "#65d9a5", "yellow": "#f3c969", "blue": "#79a9ff", "purple": "#c69cff", "cyan": "#65d9e8", "white": "#e8eaf0", "brightBlack": "#777b87", "brightRed": "#ff8791", "brightGreen": "#83e8b8", "brightYellow": "#ffdb82", "brightBlue": "#94baff", "brightPurple": "#d4b2ff", "brightCyan": "#84e7f0", "brightWhite": "#ffffff", "background": "#14151a", "foreground": "#e8eaf0", "selectionBackground": "#373b49", "cursorAccent": "#14151a", "cursor": "#e8eaf0" }

Hide
Type "start /B node demos/hold-port.js 3002 >nul 2>&1"
Enter
Sleep 1s
Type "cls"
Enter
Show

Type "npx portdiag@latest 49152"
Enter
Sleep 4s

Type "npx portdiag@latest 3002"
Enter
Sleep 4s

Type "npx portdiag@latest 3002 --json"
Enter
Sleep 5s
