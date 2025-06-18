# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-XX-XX

### Added
- **GitHub Codespaces Support**: The project is now primarily designed to run in a cloud-native environment, ensuring cross-platform compatibility.
- **Dev Container (`.devcontainer/devcontainer.json`)**: Added a configuration file that automates the entire environment setup on Codespaces, including installing system dependencies like LibreOffice and all Python packages.
- **LibreOffice Integration**: Implemented a new slide extraction method using a headless instance of LibreOffice to convert `.pptx` to `.pdf`, making the script compatible with Linux.

### Changed
- **Pivoted to a Cross-Platform Architecture**: The entire script is now designed to run on Linux-based environments, removing the hard dependency on Windows.
- **Upgraded TTS Engine**: Switched from the basic `pyttsx3` back to the higher-quality **`Coqui TTS`**. This was made possible because the dev container allows us to enforce a specific, compatible Python version (3.11).
- **Updated `requirements.txt`**: Modified dependencies to include `TTS` and remove Windows-specific libraries.

### Removed
- **Removed Windows Dependency**: All reliance on Windows COM automation and Microsoft PowerPoint has been eliminated from the core logic.
- Removed `pyttsx3` and `comtypes` from dependencies.

---
## [1.0.0] - 2024-XX-XX

### Added
- **Final Stable Windows Architecture:** The script uses a robust hybrid model:
  - **Gemini API** for high-quality, AI-powered script generation from slide images.
  - **Local `pyttsx3` Engine** for reliable, offline Text-to-Speech synthesis.
  - **`moviepy` Library** for direct video creation from images and audio, bypassing `python-pptx` bugs.
- **Intelligent Checkpointing:** The script automatically detects and skips slides for which audio has already been generated.

### Changed
- Replaced all previous methods of video creation (`python-pptx` audio embedding, PowerPoint COM automation) with a pure Python `moviepy` solution. This resolved the final, stubborn `'Part' object has no attribute 'sha1'` bug.

## [0.8.0] - Internal Development

### Changed
- **Switched to Offline TTS:** Moved from online TTS APIs to a local solution to solve persistent rate-limiting issues.
- **Initial Offline Choice (`pyttsx3`):** Replaced `Coqui TTS` with `pyttsx3` due to Python version incompatibility errors.

## [0.7.0] - Internal Development

### Added
- **Pivoted to Offline TTS:** Integrated the `Coqui TTS` library for high-quality, local Text-to-Speech synthesis.

## [0.6.0] - Internal Development

### Added
- **Switched TTS Provider to Groq:** Replaced Gemini TTS with the Groq API to avoid strict rate limits.

### Fixed
- Investigated and resolved the `ModuleNotFoundError` for `moviepy` by discovering the root cause was a corrupted pip cache serving an ancient version. The fix was a forced re-install of the modern version.

## [0.5.0] - Internal Development

### Added
- **Resilience and Rate-Limit Handling:**
  - Introduced a `time.sleep()` delay.
  - Added intelligent checkpointing to allow the script to be resumed.

## [0.4.0] - Internal Development

### Changed
- **Pivoted to All-in-One Gemini:** Removed dependency on `google-cloud-texttospeech`.

### Fixed
- Debugged multiple iterations of Gemini API model names and function calls.

## [0.1.0] - Initial Conception

### Added
- **Initial Proof of Concept:**
  - Used Google Cloud Platform for TTS.
  - Used `python-pptx` to embed audio.
  - Used PowerPoint COM automation to export the final video.