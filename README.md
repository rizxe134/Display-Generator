# OLED Studio Desktop

An offline desktop drawing app for Windows, macOS, and Linux. Design graphics for a monochrome OLED and export Arduino / ESP32 C++ or Raspberry Pi Linux Python code.

## Features

- Pixel pencil and eraser, lines, rectangles, ellipses and circles, filled shapes, and bitmap text.
- Exact pixel preview, undo/redo, inversion, grid, and starter designs.
- SH1106 128×64 and SSD1306 128×64 / 128×32 I²C presets.
- Editable ESP32 SDA/SCL pins and I²C addresses 0x3C / 0x3D.
- Native dialogs to export `.ino` / `.py` code and save / open `.oled.json` projects.
- All app assets ship locally. No server, account, or network connection is required to draw or export.

## Install

Download the installer for your OS from [GitHub Releases](https://github.com/rizxe134/Display-Generator/releases) once a tagged build is available:

| OS | Package |
| --- | --- |
| Windows x64 / arm64 | Setup `.exe` or portable `.exe` |
| macOS Intel / Apple Silicon | `.dmg` or `.zip` for x64 / arm64 |
| Linux x64 / arm64 | `.AppImage` or `.deb` |

The initial builds are unsigned. Windows or macOS may block or warn about unsigned apps; signed distribution needs the owner's signing certificates. No signing credentials are included in this repository.

## Develop and build

Use Node.js 22 LTS or newer and npm:

```sh
npm ci
npm test
npm start
```

Build on the appropriate OS:

```sh
npm run dist:win
npm run dist:mac
npm run dist:linux
```

Output is placed in `release/`. `npm run pack` creates an unpacked application. `npm run smoke` checks that the native window, renderer, and preload bridge initialize successfully.

GitHub Actions builds the three platforms on pushes to `main` and through **Actions → Desktop installers → Run workflow**. Download the completed workflow artifacts. A `v*` tag publishes the installers to a GitHub Release after all platform builds succeed:

```sh
git tag v1.0.0
git push origin v1.0.0
```

## Use

Choose a drawing tool and drag on the canvas. To add text, enter text, select Text, and click the canvas. Text uses a 5×7 bitmap font; lowercase becomes uppercase and unsupported characters become `?`. Shapes and text outside the display are clipped.

Use **Save project** to keep editable artwork and display settings. Use **Open project** to restore it. Exported code is a static bitmap, not an editable project. Save before closing the app.

Select your actual controller, resolution, I²C address, and board before exporting. Confirm your module's supply voltage and wiring from its documentation.

- **ESP32 / Arduino:** install Adafruit GFX plus Adafruit SH110X or Adafruit SSD1306 through Arduino IDE's Library Manager. Open the exported `.ino`, select the board, and upload. ESP32 pins are configurable; Arduino uses hardware I²C pins (Uno/Nano: A4 SDA, A5 SCL).
- **Raspberry Pi Linux:** enable I²C, create a Python virtual environment, and install `luma.oled` and `Pillow`. Run the exported `.py`; SDA is GPIO2, SCL is GPIO3, bus is 1. Raspberry Pi Pico is not supported by this export.

Driver references: [Adafruit SH110X](https://github.com/adafruit/Adafruit_SH110x), [Adafruit SSD1306](https://github.com/adafruit/Adafruit_SSD1306), [luma.oled](https://luma-oled.readthedocs.io/en/latest/python-usage.html).

## Implementation

Electron's renderer uses a sandbox with Node integration disabled and context isolation enabled. A limited preload bridge exposes native file dialogs and clipboard operations. Project imports validate sizes, settings, and every pixel. External links are restricted to the three driver documentation pages.

Generated exports have been checked for pixel layout and Python syntax. Hardware behavior requires testing on the matching physical display. Platform build success is established by the corresponding local build or GitHub Actions result, not by configuration alone.

## License

MIT license. See [LICENSE](LICENSE).
