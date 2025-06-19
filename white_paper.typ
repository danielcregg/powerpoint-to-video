// Document settings
#set document(
  title: "Auto-Presenter: AI-Powered Automation of PowerPoint-to-Video Conversion",
  author: "Jules (AI Software Engineer)",
  date: datetime.today(),
)
#set page(margin: (x: 1in, y: 1in))
#set text(font: "Linux Libertine", lang: "en")

// Heading styles
#set heading(numbering: "1.")
#show heading.where(level: 1): it => {
  v(2em, weak: true)
  strong(it)
  v(0.5em, weak: true)
}
#show heading.where(level: 2): it => {
  v(1.5em, weak: true)
  strong(it)
  v(0.4em, weak: true)
}

// Code block style
#let codeblock(lang: none, body) = {
  block(
    fill: luma(240),
    inset: 8pt,
    radius: 4pt,
    width: 100%,
    raw(lang: lang, body.text)
  )
}

// Abstract
#block[
  #heading(level: 2, outlined: false)[Abstract]
  The manual conversion of presentations into engaging video content is a significant challenge, demanding considerable time and specialized skills. This white paper introduces Auto-Presenter, an innovative tool designed to automate the transformation of PowerPoint (`.pptx`) presentations into narrated videos. By leveraging a sophisticated pipeline incorporating AI-driven script generation via Google's Gemini models, high-quality offline Text-to-Speech (TTS) synthesis using Coqui TTS, and automated video assembly with MoviePy, Auto-Presenter streamlines the content creation process. The primary benefits include substantial efficiency gains, enhanced accessibility for users of all skill levels, and the production of consistent, professional-quality video content.
]

#outline() // Table of contents

= Introduction
Video content has become an indispensable medium for communication, education, and marketing. Its ability to convey complex information in an engaging format is unparalleled. However, the creation of video content, particularly from existing static presentations like PowerPoint slides, remains a labor-intensive process. It often requires a blend of skills, from scriptwriting and narration to video editing and post-production. These demands can create bottlenecks, limiting the speed and scale at which organizations and individuals can produce valuable video materials.

The Auto-Presenter project addresses these challenges head-on. Its primary goal is to provide a seamless, automated workflow for converting `.pptx` files into fully narrated videos. This white paper will delve into the problem domain, detail the architecture and technical implementation of the Auto-Presenter tool, explore its key features and benefits, and discuss potential future developments.

= The Challenge: Bridging the Gap Between Static Presentations and Engaging Videos
Transforming a static PowerPoint presentation into a dynamic and engaging video involves several hurdles:
- *Time-Intensive Narration and Scripting:* Crafting a compelling script for each slide and then recording the narration can take hours, if not days, depending on the presentation's length and complexity.
- *Specialized Skills Required:* Effective narration, audio recording, and video editing are skills that not everyone possesses. This often necessitates outsourcing or relying on a small pool of skilled individuals.
- *Consistency Issues:* Maintaining a consistent tone, pacing, and quality across multiple videos, or even within a single long video, can be difficult when done manually.
- *Platform Dependencies and Tooling Costs:* Many traditional video creation workflows are tied to specific operating systems or expensive proprietary software, limiting accessibility and increasing costs.
- *Inefficiency in Updates:* Modifying a small portion of a manually created video often requires re-recording and re-editing significant sections, making updates cumbersome.

These factors contribute to a process that is often slow, expensive, and difficult to scale, preventing valuable information locked in presentations from reaching a wider audience in video format.

= The Auto-Presenter Solution: An Automated Approach
Auto-Presenter is a Python-based tool designed to automate the entire lifecycle of converting PowerPoint presentations into narrated videos. Its core value proposition is to dramatically simplify this process, making it accessible to users regardless of their technical expertise in video production.

The fundamental workflow of Auto-Presenter involves:
1. *Slide Extraction:* The `.pptx` file is first converted into a PDF format, from which individual slides are extracted as high-resolution PNG images.
2. *AI-Powered Script Generation:* Each slide image is analyzed by a Google Gemini vision model, which generates a relevant and context-aware narration script.
3. *Text-to-Speech (TTS) Synthesis:* The generated scripts are converted into natural-sounding speech using the Coqui TTS engine.
4. *Video Assembly:* The slide images and their corresponding audio narrations are compiled into a standard MP4 video file.

This automated pipeline is designed for efficiency, quality, and ease of use.

= Technical Implementation & Architecture
Auto-Presenter is built using Python and integrates several powerful open-source tools and AI services. It is designed to run in a Linux-based or containerized environment for maximum compatibility and ease of dependency management.

== Core Workflow
The conversion process is orchestrated by the main script, `auto_presenter.py`, and follows these key steps:

=== PowerPoint (`.pptx`) to PDF Conversion
To ensure cross-platform compatibility and avoid reliance on Microsoft Office, Auto-Presenter uses a headless instance of *LibreOffice* to convert the input `.pptx` file into a PDF document. This is achieved via a system call:

#codeblock(lang: "bash")[
soffice --headless --convert-to pdf --outdir /path/to/temp /path/to/presentation.pptx
]

=== PDF to Slide Image Extraction
Once the PDF is generated, *PyMuPDF (fitz)* is used to extract each page (slide) as a high-resolution PNG image (300 DPI). This ensures that the visual quality of the slides is maintained in the final video.
#codeblock(lang: "python")[
import fitz # PyMuPDF
doc = fitz.open("presentation.pdf")
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=300)
    pix.save(f"slide_{i+1}.png")
]

=== AI-Powered Script Generation (Google Gemini Vision)
This is a critical step where the content for narration is created.
- *Intelligent Model Selection:* Auto-Presenter queries available Google Gemini models and selects the most suitable one based on a predefined priority list. This list favors newer and more capable models like "gemini-2.5-flash" or "gemini-1.5-flash" for their balance of quality, speed, and cost-effectiveness.
- *Context-Aware Prompting:* For each slide image, a prompt is sent to the selected Gemini vision model. The prompt is dynamically adjusted based on the slide's position:
  - *First Slide:* Includes instructions for a greeting and topic introduction.
  - *Middle Slides:* Focuses on explaining the content without repetitive introductions.
  - *Final Slide:* Requests a professional closing, summary, or call to action.
  The prompt also instructs the AI to act as a professional presenter and keep scripts concise (e.g., under 150 words).
- *API Interaction:* The `google-generativeai` library is used to upload slide images and receive the generated text script.

#codeblock(lang: "python")[
import google.generativeai as genai
# vision_model is an initialized GenerativeModel
slide_image = genai.upload_file("slide_1.png")
prompt = ["Instruction for AI presenter...", "Context for slide position...", slide_image]
response = vision_model.generate_content(prompt)
script = response.text.strip()
]

=== Offline Text-to-Speech Synthesis (Coqui TTS)
The generated text scripts are converted into audio using *Coqui TTS*.
- *High-Quality Voice:* Coqui TTS provides natural-sounding voices. The script uses a pre-trained model (e.g., `tts_models/en/ljspeech/vits`).
- *Offline Capability:* After the initial model download, TTS synthesis occurs locally, ensuring consistency and avoiding reliance on network connectivity for this step.
- *Output Format:* Audio is saved as `.wav` files, one for each slide.

#codeblock(lang: "python")[
from TTS.api import TTS
tts_engine = TTS("tts_models/en/ljspeech/vits")
tts_engine.tts_to_file(text="Generated script content...", file_path="audio_1.wav")
]

=== Video Assembly (MoviePy)
*MoviePy* is used to combine the slide images and their corresponding audio narrations into the final video.
- Each slide image is treated as an `ImageClip`.
- The duration of each image clip is set to match the duration of its associated `AudioFileClip`.
- The audio is then set for the image clip, and all such clips are concatenated to form the final video.
- *Robust Encoding:* The script attempts to encode the video using H.264 with AAC audio. It includes fallbacks to an ultrafast H.264 preset and then to the MP4V codec to maximize the chances of successful video creation across different environments.

#codeblock(lang: "python")[
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
clips = []
# For each slide and audio
audio_clip = AudioFileClip("audio_1.wav")
image_clip = ImageClip("slide_1.png").set_duration(audio_clip.duration)
video_clip = image_clip.set_audio(audio_clip)
clips.append(video_clip)
# After processing all slides
final_video = concatenate_videoclips(clips)
final_video.write_videofile("presentation.mp4", fps: 24, codec: "libx264", audio_codec: "aac")
]

== Key Technologies & Tools
- *Python 3.11+:* The core programming language.
- *`google-generativeai`:* Official Google library for Gemini API access.
- *`TTS` (Coqui TTS):* For high-quality, offline text-to-speech. Version `>=0.17.0` is used.
- *`moviepy`:* For versatile video editing and composition. Version `1.0.3` is specified.
- *`PyMuPDF` (fitz):* For efficient PDF processing and image extraction.
- *LibreOffice:* Used as a headless service for `.pptx` to `.pdf` conversion.
- *`python-dotenv`:* For managing API keys securely.

== Smart Script Management
A key feature for usability and efficiency:
- Generated scripts are saved as plain text files (e.g., `script_1.txt`, `script_2.txt`) in a temporary directory.
- Users can manually edit these files to refine or completely change the narration.
- On subsequent runs of Auto-Presenter for the same presentation, the tool checks the modification times of the script files against their corresponding audio files.
- Audio is only regenerated for a slide if its script file is newer than its audio file, or if the audio file does not exist. This incremental processing significantly speeds up iterations where only minor script changes are made.

== Environment Considerations
Auto-Presenter is designed with containerization in mind, as evidenced by the `.devcontainer/devcontainer.json` file. This configuration automates the setup of a development environment with Python 3.11, LibreOffice, and all necessary Python packages, ensuring consistency and simplifying deployment, especially on Linux-based systems or services like GitHub Codespaces.

= Key Features & Capabilities
Auto-Presenter offers a compelling set of features:
- *Cross-Platform Design:* By utilizing LibreOffice for PowerPoint conversion and Python-based tools for subsequent steps, the system is primarily targeted for Linux environments, moving away from Windows-specific COM automation.
- *AI-Driven Narration:* The use of Google Gemini models allows for intelligent script generation that understands the context of slide visuals.
- *High-Quality, Editable Scripts:* Scripts are not just generated but are also made available for user review and modification, providing full control over the final narration.
- *Efficient Incremental Processing:* The smart script management system ensures that only necessary audio regeneration occurs, saving time and computational resources.
- *Robust Video Output:* Multiple video encoding fallbacks (H.264, MP4V) improve the reliability of producing a usable MP4 video file.
- *Offline TTS Synthesis:* Coqui TTS enables high-quality voice generation locally, ensuring consistency and speed after initial model setup.
- *Intelligent Model Selection:* The script automatically selects the best available Gemini model from a prioritized list, balancing capability with API limits.

= Benefits of Using Auto-Presenter
The adoption of Auto-Presenter can yield significant advantages:
- *Significant Time Savings:* Automating the most laborious parts of video creation—scripting, narration, and assembly—drastically reduces production time.
- *Enhanced Accessibility:* Empowers educators, marketers, and other professionals to create video content without needing specialized video production skills or software.
- *Improved Consistency:* AI-generated scripts and TTS ensure a uniform style and quality in narration, which can be hard to achieve manually, especially across multiple presentations.
- *Customization and Control:* While automated, the system allows for manual overrides of scripts, giving users the final say on content.
- *Cost-Effectiveness:* Leverages open-source tools and the free/lower-cost tiers of AI services, making it an economical solution.
- *Professional Quality Output:* The focus on 300 DPI images, high-quality TTS, and standard video codecs contributes to a polished final product.

= Visualizing the Process
The architecture and workflow of Auto-Presenter can be visualized through several diagrams. (These would ideally be rendered images from the Mermaid diagrams in the README. For this Typst document, we describe them and indicate placeholders for future image inclusion.)
- *Overall Architecture:* A block diagram showing the flow from PowerPoint input, through LibreOffice conversion, PDF/image extraction, Gemini script generation, Coqui TTS audio synthesis, and finally MoviePy video assembly to the MP4 output.
  #figure(
    image("images/architecture_overview.png", width: 90%),
    caption: "Overall Architecture of the Auto-Presenter System."
  )
- *Slide Processing Pipeline:* A sequence diagram illustrating the interactions between the user, the main script, LibreOffice, Gemini API, Coqui TTS, and MoviePy for a single slide.
  #figure(
    image("images/slide_processing_pipeline.png", width: 90%),
    caption: "Slide Processing Pipeline detailing component interactions."
  )
- *Smart Script Management:* A flowchart depicting the logic for checking if a script exists, if it has been modified, and whether audio needs to be (re)generated.
  #figure(
    image("images/smart_script_management.png", width: 70%),
    caption: "Smart Script Management workflow for incremental processing."
  )
- *Intelligent Model Selection:* A flowchart showing how the best Gemini model is chosen.
  #figure(
    image("images/intelligent_model_selection.png", width: 80%),
    caption: "Intelligent Gemini Model Selection logic."
  )
// Other available diagrams (can be uncommented if needed):
// - *Advanced Workflow:*
//   #figure(
//     image("images/advanced_workflow.png", width: 90%),
//     caption: "Advanced user workflow including script editing."
//   )
// - *File Structure:*
//   #figure(
//     image("images/file_structure.png", width: 60%),
//     caption: "Typical file structure generated by Auto-Presenter."
//   )

= Use Cases & Applications
Auto-Presenter is versatile and can be applied in various scenarios:
- *Educational Content Creation:* Lecturers and teachers can quickly convert their slide decks into video lessons for online learning platforms.
- *Corporate Training Videos:* Companies can efficiently produce training materials from existing presentations.
- *Product Demonstrations & Marketing:* Marketing teams can create narrated product showcases or feature explanations.
- *Archival Conversion:* Transforming large archives of existing presentations into a more accessible video format.
- *Rapid Prototyping of Video Ideas:* Quickly generating a draft video to evaluate script and flow before investing in higher-production efforts.

= Future Work & Potential Enhancements
While Auto-Presenter is a capable tool, there are several avenues for future development:
- *Expanded Input Format Support:* Adding capabilities to process Google Slides or Apple Keynote presentations, which would require different initial conversion mechanisms.
- *Advanced TTS Customization:* Offering a wider selection of Coqui TTS voices or even integration with other TTS engines, along with controls for speech rate and pitch.
- *Visual Enhancements:* Incorporating options for adding background music, simple transitions between slides, or watermarks.
- *User Interface (UI):* Developing a graphical user interface (web-based or desktop application) to make the tool even more accessible to non-technical users.
- *Cloud Integration:* Direct integration with cloud storage services (e.g., Google Drive, Dropbox) for input file selection and output video storage.
- *Batch Processing Improvements:* More robust handling of very large batches of presentations, including enhanced error reporting and recovery.

= Conclusion
Auto-Presenter stands as a significant step forward in simplifying and accelerating the conversion of PowerPoint presentations into engaging video content. By thoughtfully integrating AI-powered script generation, high-quality text-to-speech synthesis, and robust automation, it addresses many of the traditional pain points associated with video creation. The tool's emphasis on cross-platform compatibility, editable outputs, and efficient processing makes it a valuable asset for educators, businesses, and individual content creators alike. As AI and automation technologies continue to evolve, tools like Auto-Presenter will play an increasingly crucial role in democratizing content creation and unlocking the potential of existing information repositories.

= Acknowledgments
The Auto-Presenter project builds upon the capabilities of several outstanding open-source projects and APIs, including:
- Google Gemini API for its powerful vision and language models.
- Coqui TTS for providing high-quality, open-source text-to-speech synthesis.
- LibreOffice for its robust, cross-platform document conversion features.
- MoviePy for its flexible and comprehensive video editing capabilities in Python.
- PyMuPDF for its efficient handling of PDF documents.

Their contributions to the open-source community are invaluable.
]
