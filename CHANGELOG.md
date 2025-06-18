# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-XX-XX

### Added
- **Final Stable Architecture:** The script now uses a robust hybrid model:
  - **Gemini API** for high-quality, AI-powered script generation from slide images.
  - **Local `pyttsx3` Engine** for reliable, offline Text-to-Speech synthesis, avoiding all API rate limits.
  - **`moviepy` Library** for direct video creation from images and audio, completely bypassing the buggy `python-pptx` audio embedding feature.
- **Intelligent Checkpointing:** The script automatically detects and skips slides for which audio has already been generated, making it fully resumable.
- **PowerPoint for Rendering:** The script leverages an installed copy of Microsoft PowerPoint for the single task it excels at: creating a high-fidelity PDF from the original `.pptx` file to ensure perfect slide visuals.

### Changed
- Replaced all previous methods of video creation (`python-pptx` audio embedding, PowerPoint COM automation for video export) with a pure Python `moviepy` solution. This resolved the final, stubborn `'Part' object has no attribute 'sha1'` bug.

## [0.8.0] - Internal Development

### Changed
- **Switched to Offline TTS:** Moved from online TTS APIs to a local solution to solve persistent rate-limiting issues.
- **Initial Offline Choice (`pyttsx3`):** Replaced the `Coqui TTS` implementation with `pyttsx3` due to Python version incompatibility errors (`>=3.9, <3.12`) encountered during the `pip install TTS` step. `pyttsx3` was chosen for its universal compatibility and simple installation.

### Removed
- Removed all code related to the `Coqui TTS` library.

## [0.7.0] - Internal Development

### Added
- **Pivoted to Offline TTS:** Integrated the `Coqui TTS` library for high-quality, local Text-to-Speech synthesis as a solution to API rate limits.

### Removed
- Removed all code related to the Groq API.

## [0.6.0] - Internal Development

### Added
- **Switched TTS Provider to Groq:** Replaced the Gemini TTS service with the **Groq API** to try and avoid the strict rate limits of the Gemini free tier.

### Fixed
- Investigated and resolved the `ModuleNotFoundError` for `moviepy` by discovering the root cause was a corrupted pip cache serving an ancient version (`2.2.1`). The fix was a forced re-install of the modern version (`1.0.3`) using `--force-reinstall --no-cache-dir`.

### Removed
- Removed all code related to Gemini TTS.

## [0.5.0] - Internal Development

### Added
- **Resilience and Rate-Limit Handling:**
  - Introduced a `time.sleep()` delay between API calls to respect per-minute rate limits.
  - Added intelligent checkpointing to check if an audio file already exists before making API calls, allowing the script to be resumed after hitting a daily quota.

### Fixed
- Resolved `429: Quota Exceeded` errors from the Gemini TTS API.

## [0.4.0] - Internal Development

### Changed
- **Pivoted to All-in-One Gemini:** Removed the dependency on the `google-cloud-texttospeech` library to avoid the need for a billing-enabled Google Cloud account. The script was updated to use Gemini's native (but heavily rate-limited) TTS capabilities.

### Fixed
- Debugged multiple iterations of Gemini API errors:
  - Updated deprecated vision model from `gemini-pro-vision` to `gemini-1.5-flash-latest`.
  - Corrected incorrect TTS function calls (`genai.text_to_audio` vs `model.generate_content`).
  - Corrected TTS model name from `text-to-speech-001` to the correct `models/tts-001` after using `genai.list_models()` to debug.

## [0.1.0] - Initial Conception

### Added
- **Initial Proof of Concept:**
  - Script takes a `.pptx` file as input.
  - Uses `python-pptx` and the Google Cloud Platform (`google-cloud-texttospeech`) for separate vision and TTS tasks.
  - Uses `python-pptx` to embed the generated audio back into the presentation slides.
  - Uses PowerPoint COM automation to export the final presentation as a video.
