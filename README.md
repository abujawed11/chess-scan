
```
chess-scan
├─ .claude
│  └─ settings.local.json
├─ README.md
├─ scan-back
│  ├─ .env
│  ├─ .env.example
│  ├─ app
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ chess_models.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ chess_models.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ routers
│  │  │  ├─ engine.py
│  │  │  ├─ vision.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ engine.cpython-312.pyc
│  │  │     ├─ vision.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ services
│  │  │  ├─ board_detector.py
│  │  │  ├─ cnn_chess_detector.py
│  │  │  ├─ engine_service.py
│  │  │  ├─ simple_chess_detector.py
│  │  │  ├─ template_chess_detector.py
│  │  │  ├─ vision_service.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ board_detector.cpython-312.pyc
│  │  │     ├─ engine_service.cpython-312.pyc
│  │  │     ├─ simple_chess_detector.cpython-312.pyc
│  │  │     ├─ template_chess_detector.cpython-312.pyc
│  │  │     ├─ vision_service.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  │     ├─ main.cpython-312.pyc
│  │     └─ __init__.cpython-312.pyc
│  ├─ README.md
│  ├─ requirements.txt
│  ├─ stockfish
│  │  ├─ AUTHORS
│  │  ├─ CITATION.cff
│  │  ├─ CONTRIBUTING.md
│  │  ├─ Copying.txt
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ benchmark.cpp
│  │  │  ├─ benchmark.h
│  │  │  ├─ bitboard.cpp
│  │  │  ├─ bitboard.h
│  │  │  ├─ engine.cpp
│  │  │  ├─ engine.h
│  │  │  ├─ evaluate.cpp
│  │  │  ├─ evaluate.h
│  │  │  ├─ incbin
│  │  │  │  ├─ incbin.h
│  │  │  │  └─ UNLICENCE
│  │  │  ├─ main.cpp
│  │  │  ├─ Makefile
│  │  │  ├─ memory.cpp
│  │  │  ├─ memory.h
│  │  │  ├─ misc.cpp
│  │  │  ├─ misc.h
│  │  │  ├─ movegen.cpp
│  │  │  ├─ movegen.h
│  │  │  ├─ movepick.cpp
│  │  │  ├─ movepick.h
│  │  │  ├─ nnue
│  │  │  │  ├─ features
│  │  │  │  │  ├─ half_ka_v2_hm.cpp
│  │  │  │  │  └─ half_ka_v2_hm.h
│  │  │  │  ├─ layers
│  │  │  │  │  ├─ affine_transform.h
│  │  │  │  │  ├─ affine_transform_sparse_input.h
│  │  │  │  │  ├─ clipped_relu.h
│  │  │  │  │  ├─ simd.h
│  │  │  │  │  └─ sqr_clipped_relu.h
│  │  │  │  ├─ network.cpp
│  │  │  │  ├─ network.h
│  │  │  │  ├─ nnue_accumulator.h
│  │  │  │  ├─ nnue_architecture.h
│  │  │  │  ├─ nnue_common.h
│  │  │  │  ├─ nnue_feature_transformer.h
│  │  │  │  ├─ nnue_misc.cpp
│  │  │  │  └─ nnue_misc.h
│  │  │  ├─ numa.h
│  │  │  ├─ perft.h
│  │  │  ├─ position.cpp
│  │  │  ├─ position.h
│  │  │  ├─ score.cpp
│  │  │  ├─ score.h
│  │  │  ├─ search.cpp
│  │  │  ├─ search.h
│  │  │  ├─ syzygy
│  │  │  │  ├─ tbprobe.cpp
│  │  │  │  └─ tbprobe.h
│  │  │  ├─ thread.cpp
│  │  │  ├─ thread.h
│  │  │  ├─ thread_win32_osx.h
│  │  │  ├─ timeman.cpp
│  │  │  ├─ timeman.h
│  │  │  ├─ tt.cpp
│  │  │  ├─ tt.h
│  │  │  ├─ tune.cpp
│  │  │  ├─ tune.h
│  │  │  ├─ types.h
│  │  │  ├─ uci.cpp
│  │  │  ├─ uci.h
│  │  │  ├─ ucioption.cpp
│  │  │  └─ ucioption.h
│  │  ├─ stockfish-windows-x86-64-avx2.exe
│  │  ├─ Top CPU Contributors.txt
│  │  └─ wiki
│  │     ├─ Advanced-topics.md
│  │     ├─ Compiling-from-source.md
│  │     ├─ Developers.md
│  │     ├─ Download-and-usage.md
│  │     ├─ Governance-and-responsibilities.md
│  │     ├─ Home.md
│  │     ├─ Regression-Tests.md
│  │     ├─ Stockfish-FAQ.md
│  │     ├─ Terminology.md
│  │     ├─ UCI-&-Commands.md
│  │     ├─ Useful-data.md
│  │     └─ _Footer.md
│  ├─ stockfish.zip
│  ├─ test_api.py
│  ├─ test_stockfish.py
│  └─ test_vision.py
├─ scan-front
│  ├─ .env
│  ├─ .expo
│  │  ├─ devices.json
│  │  ├─ README.md
│  │  └─ types
│  │     └─ router.d.ts
│  ├─ app
│  │  ├─ analyze.tsx
│  │  ├─ board-editor.tsx
│  │  ├─ index.tsx
│  │  ├─ scan.tsx
│  │  └─ _layout.tsx
│  ├─ app.json
│  ├─ assets
│  │  └─ images
│  │     ├─ android-icon-background.png
│  │     ├─ android-icon-foreground.png
│  │     ├─ android-icon-monochrome.png
│  │     ├─ favicon.png
│  │     ├─ icon.png
│  │     ├─ partial-react-logo.png
│  │     ├─ react-logo.png
│  │     ├─ react-logo@2x.png
│  │     ├─ react-logo@3x.png
│  │     └─ splash-icon.png
│  ├─ babel.config.js
│  ├─ components
│  │  ├─ camera
│  │  │  └─ ImageCropper.tsx
│  │  ├─ chess
│  │  │  ├─ BoardEditor.tsx
│  │  │  ├─ ChessBoard.tsx
│  │  │  └─ ChessPiece.tsx
│  │  └─ ui
│  │     ├─ Button.tsx
│  │     └─ LoadingSpinner.tsx
│  ├─ constants
│  │  └─ config.ts
│  ├─ eslint.config.js
│  ├─ expo-env.d.ts
│  ├─ global.css
│  ├─ hooks
│  ├─ metro.config.js
│  ├─ nativewind-env.d.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ services
│  │  ├─ chessEngine.ts
│  │  └─ visionApi.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  ├─ types
│  │  └─ chess.ts
│  └─ utils
│     └─ fen.ts
└─ scan-web
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ public
   │  └─ vite.svg
   ├─ README.md
   ├─ src
   │  ├─ App.css
   │  ├─ App.jsx
   │  ├─ assets
   │  │  ├─ react.svg
   │  │  └─ sample.jpg
   │  ├─ index.css
   │  ├─ main.jsx
   │  └─ VisualEditor.jsx
   └─ vite.config.js

```
```
chess-scan
├─ .claude
│  └─ settings.local.json
├─ README.md
├─ scan-back
│  ├─ .env
│  ├─ .env.example
│  ├─ app
│  │  ├─ main.py
│  │  ├─ models
│  │  │  ├─ chess_models.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ chess_models.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ routers
│  │  │  ├─ engine.py
│  │  │  ├─ vision.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ engine.cpython-312.pyc
│  │  │     ├─ vision.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ services
│  │  │  ├─ board_detector.py
│  │  │  ├─ cnn_chess_detector.py
│  │  │  ├─ engine_service.py
│  │  │  ├─ simple_chess_detector.py
│  │  │  ├─ template_chess_detector.py
│  │  │  ├─ vision_service.py
│  │  │  ├─ __init__.py
│  │  │  └─ __pycache__
│  │  │     ├─ board_detector.cpython-312.pyc
│  │  │     ├─ engine_service.cpython-312.pyc
│  │  │     ├─ simple_chess_detector.cpython-312.pyc
│  │  │     ├─ template_chess_detector.cpython-312.pyc
│  │  │     ├─ template_storage.cpython-312.pyc
│  │  │     ├─ vision_service.cpython-312.pyc
│  │  │     └─ __init__.cpython-312.pyc
│  │  ├─ __init__.py
│  │  └─ __pycache__
│  │     ├─ main.cpython-312.pyc
│  │     └─ __init__.cpython-312.pyc
│  ├─ ml
│  │  └─ models
│  ├─ README.md
│  ├─ requirements.txt
│  ├─ stockfish
│  │  ├─ AUTHORS
│  │  ├─ CITATION.cff
│  │  ├─ CONTRIBUTING.md
│  │  ├─ Copying.txt
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ benchmark.cpp
│  │  │  ├─ benchmark.h
│  │  │  ├─ bitboard.cpp
│  │  │  ├─ bitboard.h
│  │  │  ├─ engine.cpp
│  │  │  ├─ engine.h
│  │  │  ├─ evaluate.cpp
│  │  │  ├─ evaluate.h
│  │  │  ├─ incbin
│  │  │  │  ├─ incbin.h
│  │  │  │  └─ UNLICENCE
│  │  │  ├─ main.cpp
│  │  │  ├─ Makefile
│  │  │  ├─ memory.cpp
│  │  │  ├─ memory.h
│  │  │  ├─ misc.cpp
│  │  │  ├─ misc.h
│  │  │  ├─ movegen.cpp
│  │  │  ├─ movegen.h
│  │  │  ├─ movepick.cpp
│  │  │  ├─ movepick.h
│  │  │  ├─ nnue
│  │  │  │  ├─ features
│  │  │  │  │  ├─ half_ka_v2_hm.cpp
│  │  │  │  │  └─ half_ka_v2_hm.h
│  │  │  │  ├─ layers
│  │  │  │  │  ├─ affine_transform.h
│  │  │  │  │  ├─ affine_transform_sparse_input.h
│  │  │  │  │  ├─ clipped_relu.h
│  │  │  │  │  ├─ simd.h
│  │  │  │  │  └─ sqr_clipped_relu.h
│  │  │  │  ├─ network.cpp
│  │  │  │  ├─ network.h
│  │  │  │  ├─ nnue_accumulator.h
│  │  │  │  ├─ nnue_architecture.h
│  │  │  │  ├─ nnue_common.h
│  │  │  │  ├─ nnue_feature_transformer.h
│  │  │  │  ├─ nnue_misc.cpp
│  │  │  │  └─ nnue_misc.h
│  │  │  ├─ numa.h
│  │  │  ├─ perft.h
│  │  │  ├─ position.cpp
│  │  │  ├─ position.h
│  │  │  ├─ score.cpp
│  │  │  ├─ score.h
│  │  │  ├─ search.cpp
│  │  │  ├─ search.h
│  │  │  ├─ syzygy
│  │  │  │  ├─ tbprobe.cpp
│  │  │  │  └─ tbprobe.h
│  │  │  ├─ thread.cpp
│  │  │  ├─ thread.h
│  │  │  ├─ thread_win32_osx.h
│  │  │  ├─ timeman.cpp
│  │  │  ├─ timeman.h
│  │  │  ├─ tt.cpp
│  │  │  ├─ tt.h
│  │  │  ├─ tune.cpp
│  │  │  ├─ tune.h
│  │  │  ├─ types.h
│  │  │  ├─ uci.cpp
│  │  │  ├─ uci.h
│  │  │  ├─ ucioption.cpp
│  │  │  └─ ucioption.h
│  │  ├─ stockfish-windows-x86-64-avx2.exe
│  │  ├─ Top CPU Contributors.txt
│  │  └─ wiki
│  │     ├─ Advanced-topics.md
│  │     ├─ Compiling-from-source.md
│  │     ├─ Developers.md
│  │     ├─ Download-and-usage.md
│  │     ├─ Governance-and-responsibilities.md
│  │     ├─ Home.md
│  │     ├─ Regression-Tests.md
│  │     ├─ Stockfish-FAQ.md
│  │     ├─ Terminology.md
│  │     ├─ UCI-&-Commands.md
│  │     ├─ Useful-data.md
│  │     └─ _Footer.md
│  ├─ stockfish.zip
│  ├─ test_api.py
│  ├─ test_stockfish.py
│  └─ test_vision.py
├─ scan-front
│  ├─ .env
│  ├─ .expo
│  │  ├─ devices.json
│  │  ├─ README.md
│  │  └─ types
│  │     └─ router.d.ts
│  ├─ app
│  │  ├─ analyze.tsx
│  │  ├─ board-editor.tsx
│  │  ├─ index.tsx
│  │  ├─ scan.tsx
│  │  └─ _layout.tsx
│  ├─ app.json
│  ├─ assets
│  │  └─ images
│  │     ├─ android-icon-background.png
│  │     ├─ android-icon-foreground.png
│  │     ├─ android-icon-monochrome.png
│  │     ├─ favicon.png
│  │     ├─ icon.png
│  │     ├─ partial-react-logo.png
│  │     ├─ react-logo.png
│  │     ├─ react-logo@2x.png
│  │     ├─ react-logo@3x.png
│  │     └─ splash-icon.png
│  ├─ babel.config.js
│  ├─ components
│  │  ├─ camera
│  │  │  └─ ImageCropper.tsx
│  │  ├─ chess
│  │  │  ├─ BoardEditor.tsx
│  │  │  ├─ ChessBoard.tsx
│  │  │  └─ ChessPiece.tsx
│  │  └─ ui
│  │     ├─ Button.tsx
│  │     └─ LoadingSpinner.tsx
│  ├─ constants
│  │  └─ config.ts
│  ├─ eslint.config.js
│  ├─ expo-env.d.ts
│  ├─ global.css
│  ├─ hooks
│  ├─ metro.config.js
│  ├─ nativewind-env.d.ts
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ services
│  │  ├─ chessEngine.ts
│  │  └─ visionApi.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  ├─ types
│  │  └─ chess.ts
│  └─ utils
│     └─ fen.ts
└─ scan-web
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ public
   │  └─ vite.svg
   ├─ README.md
   ├─ src
   │  ├─ App.css
   │  ├─ App.jsx
   │  ├─ assets
   │  │  ├─ react.svg
   │  │  └─ sample.jpg
   │  ├─ GridAdjuster.jsx
   │  ├─ index.css
   │  ├─ main.jsx
   │  ├─ utils
   │  │  └─ validateFen.js
   │  └─ VisualEditor.jsx
   └─ vite.config.js

```