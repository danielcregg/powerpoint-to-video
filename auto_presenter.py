from dotenv import load_dotenv
import os
import sys
import subprocess # New import for running command-line tools
import time
import google.generativeai as genai
from TTS.api import TTS # Using the high-quality offline TTS
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
import fitz # PyMuPDF

# --- CONFIGURATION ---
load_dotenv()
# Your Gemini API Key for script generation
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def configure_gemini_vision_model(api_key):
    """Configures and returns the Gemini vision model."""
    print("--- Configuring Gemini Vision Model ---")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        print("Error: Please paste your Gemini API key into the GEMINI_API_KEY variable.")
        sys.exit(1)
    try:
        genai.configure(api_key=api_key)
        vision_model_name = None
        for model in genai.list_models():
            if 'flash' in model.name and 'generateContent' in model.supported_generation_methods:
                vision_model_name = model.name
                break
        if not vision_model_name:
            print("Error: Could not find a suitable Gemini Vision model.")
            sys.exit(1)
        print(f"  - Vision Model Found: {vision_model_name}")
        return genai.GenerativeModel(model_name=vision_model_name)
    except Exception as e:
        print(f"An error occurred during Gemini configuration: {e}")
        sys.exit(1)

# --- NEW LINUX-COMPATIBLE FUNCTION ---
def extract_slides_as_images_linux(pptx_path, temp_folder):
    """
    Converts PPTX slides to PNG images using LibreOffice on Linux.
    This replaces the PowerPoint dependency.
    """
    print("\nStep 1: Converting PPTX to images (using LibreOffice for PDF export)...")
    if not os.path.exists(temp_folder):
        os.makedirs(temp_folder)
    
    try:
        # Construct the command to run LibreOffice in headless mode
        command = [
            "soffice", # The command for LibreOffice
            "--headless",
            "--convert-to", "pdf",
            "--outdir", temp_folder,
            pptx_path
        ]
        print(f"  - Running command: {' '.join(command)}")
        # Execute the command
        subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"  - Successfully converted PPTX to PDF using LibreOffice.")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"  - Error during PDF conversion with LibreOffice: {e}")
        print("  - Ensure LibreOffice is installed in your Codespace environment.")
        return None

    # This part remains the same, as PyMuPDF is cross-platform
    pdf_filename = os.path.splitext(os.path.basename(pptx_path))[0] + ".pdf"
    pdf_path = os.path.join(temp_folder, pdf_filename)
    
    image_paths = []
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=300)
        image_path = os.path.join(temp_folder, f"slide_{i + 1}.png")
        pix.save(image_path)
        image_paths.append(image_path)
    doc.close()
    return image_paths

def generate_script_for_slide(vision_model, image_path, slide_number, total_slides):
    """Generates a speaker script for a slide image using Gemini."""
    print(f"\nStep 2: Generating script for slide {slide_number} (using Gemini)...")
    try:
        slide_image = genai.upload_file(image_path)
        
        # Create context-aware prompts based on slide position
        if slide_number == 1:
            context_prompt = "This is the first slide of the presentation. You may greet the audience and introduce the topic."
        elif slide_number == total_slides:
            context_prompt = "This is the final slide of the presentation. Thank the audience, summarize key takeaways, or provide a professional closing."
        else:
            context_prompt = "This is a middle slide of the presentation. Continue the presentation flow without greetings or farewells."
        
        prompt = [
            "You are a professional presenter. Write a clear and engaging speaker script for this slide.",
            context_prompt,
            "Explain the key points as if presenting to an audience.",
            "Do not describe the slide's layout. Deliver the information directly.",
            "Keep the script under 150 words.",
            slide_image
        ]
        response = vision_model.generate_content(prompt)
        script = response.text.strip().replace("*", "")
        print(f"  - Script for slide {slide_number} generated successfully.")
        genai.delete_file(slide_image.name)
        return script
    except Exception as e:
        print(f"  - Error generating script for slide {slide_number}: {e}")
        return None

def synthesize_speech_with_coqui(tts_engine, text, output_path, slide_number):
    """Converts text to a WAV audio file using the offline Coqui TTS engine."""
    print(f"Step 3: Synthesizing audio for slide {slide_number} (using local Coqui TTS)...")
    if not text:
        print("  - Skipping audio synthesis due to empty script.")
        return None
    try:
        print(f"  - Starting TTS synthesis for slide {slide_number}...")
        # Use tts method instead of to_file
        tts_engine.tts_to_file(text=text, file_path=output_path)
        print(f"  - TTS synthesis completed for slide {slide_number}")
        if os.path.exists(output_path):
            print(f"  - Audio file saved: {output_path}")
            return output_path
        else:
            print(f"  - Error: Audio file was not created at {output_path}")
            return None
    except KeyboardInterrupt:
        print(f"  - Process interrupted by user for slide {slide_number}")
        return None
    except Exception as e:
        print(f"  - Error synthesizing speech for slide {slide_number}: {e}")
        print(f"  - Error type: {type(e).__name__}")
        return None

def create_video_with_moviepy(image_files, audio_files, output_path):
    """Creates a video by combining slide images and audio narrations using moviepy."""
    print("\nStep 4: Creating video from images and audio with moviepy...")
    clips = []
    for img_path, audio_path in zip(image_files, audio_files):
        if not os.path.exists(img_path):
            print(f"  - Warning: Missing image {img_path}. Skipping slide.")
            continue
        if not audio_path or not os.path.exists(audio_path):
            print(f"  - Warning: Missing audio for {os.path.basename(img_path)}. Skipping slide.")
            continue
        try:
            audio_clip = AudioFileClip(audio_path)
            image_clip = ImageClip(img_path)
            image_clip = image_clip.set_duration(audio_clip.duration)
            video_clip = image_clip.set_audio(audio_clip)
            clips.append(video_clip)
            print(f"  - Processed slide: {os.path.basename(img_path)}")
        except Exception as e:
            print(f"  - Error processing clip for {os.path.basename(img_path)}: {e}")

    if not clips:
        print("  - No clips were created. Cannot generate video.")
        print("  - This is likely due to TTS synthesis failures. Check the TTS errors above.")
        return

    print(f"  - Created {len(clips)} video clips successfully")
    final_video = concatenate_videoclips(clips)
    
    try:
        print(f"  - Writing video file: {output_path}")
        # Use more compatible settings for containerized environments
        final_video.write_videofile(
            output_path, 
            fps=24, 
            codec='libx264',
            audio_codec='aac',
            temp_audiofile='temp-audio.m4a',
            remove_temp=True,
            verbose=False,
            logger=None
        )
        print(f"\nVideo successfully created: {output_path}")
        
        # Verify the file was created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"  - Video file size: {os.path.getsize(output_path)} bytes")
        else:
            print("  - Warning: Video file appears to be empty or missing")
            
    except Exception as e:
        print(f"\nError writing final video file: {e}")
        print("  - Trying alternative H.264 method...")
        
        # Try H.264 with simpler settings first
        try:
            alt_output_path = output_path.replace('.mp4', '_alt.mp4')
            final_video.write_videofile(
                alt_output_path,
                fps=24,
                codec='libx264',
                preset='ultrafast',  # Faster encoding, larger file
                verbose=False,
                logger=None
            )
            print(f"Alternative H.264 video created: {alt_output_path}")
        except Exception as e2:
            print(f"H.264 alternative failed: {e2}")
            print("  - Falling back to MP4V...")
            # Final fallback to MP4V
            try:
                mp4v_output_path = output_path.replace('.mp4', '_mp4v.mp4')
                final_video.write_videofile(
                    mp4v_output_path,
                    fps=24,
                    codec='mpeg4',
                    verbose=False,
                    logger=None
                )
                print(f"MP4V video created: {mp4v_output_path}")
            except Exception as e3:
                print(f"All encoding methods failed: {e3}")
    
    finally:
        # Clean up clips to free memory
        for clip in clips:
            clip.close()
        final_video.close()

def main():
    if len(sys.argv) < 2:
        print("Usage: python auto_presenter.py <path_to_presentation.pptx>")
        print("Example: python auto_presenter.py my_presentation.pptx")
        sys.exit(1)
    
    vision_model = configure_gemini_vision_model(GEMINI_API_KEY)
    
    print("\n--- Initializing Local Coqui TTS Engine ---")
    print("This may take a moment and will download model files on the first run...")
    try:
        tts_engine = TTS("tts_models/en/ljspeech/vits")
        print("--- Coqui TTS Engine Initialized Successfully ---")
    except Exception as e:
        print(f"Error initializing Coqui TTS: {e}")
        sys.exit(1)

    input_pptx = os.path.abspath(sys.argv[1])
    
    # Better file validation
    if not os.path.exists(input_pptx):
        print(f"Error: File not found at {input_pptx}")
        print("Please check the file path and ensure the file exists.")
        
        # Check if user provided a filename without extension
        if not input_pptx.endswith('.pptx'):
            suggested_path = input_pptx + '.pptx'
            if os.path.exists(suggested_path):
                print(f"Did you mean: {suggested_path}?")
            else:
                print("Note: The file should have a .pptx extension")
        sys.exit(1)
    
    # Check file extension
    if not input_pptx.lower().endswith('.pptx'):
        print(f"Error: Expected a PowerPoint file (.pptx), but got: {input_pptx}")
        print("This script only works with PowerPoint (.pptx) files.")
        sys.exit(1)
        
    base_dir = os.path.dirname(input_pptx)
    file_name = os.path.splitext(os.path.basename(input_pptx))[0]
    temp_dir = os.path.join(base_dir, f"{file_name}_temp_files")
    
    # Call the new Linux-compatible function
    slide_images = extract_slides_as_images_linux(input_pptx, temp_dir)
    if not slide_images:
        sys.exit(1)

    audio_files = []
    successful_audio_count = 0
    
    for i, img_path in enumerate(slide_images):
        slide_num = i + 1
        audio_path = os.path.join(temp_dir, f"audio_{slide_num}.wav")

        if os.path.exists(audio_path):
            print(f"\n--- Audio for slide {slide_num} already exists. Skipping. ---")
            audio_files.append(audio_path)
            successful_audio_count += 1
            continue
        
        script = generate_script_for_slide(vision_model, img_path, slide_num, len(slide_images))
        
        if script:
            print(f"  - Generated script: {script[:100]}..." if len(script) > 100 else f"  - Generated script: {script}")
            synthesized_audio = synthesize_speech_with_coqui(tts_engine, script, audio_path, slide_num)
            if synthesized_audio:
                successful_audio_count += 1
            audio_files.append(synthesized_audio)
        else:
            print(f"  - No script generated for slide {slide_num}")
            audio_files.append(None)

    print(f"\n--- Audio Generation Summary ---")
    print(f"  - Total slides: {len(slide_images)}")
    print(f"  - Successful audio files: {successful_audio_count}")
    print(f"  - Failed audio files: {len(slide_images) - successful_audio_count}")

    if successful_audio_count == 0:
        print("  - No audio files were created. Cannot generate video.")
        sys.exit(1)

    video_output_path = os.path.abspath(os.path.join(base_dir, f"{file_name}_presentation.mp4"))
    print(f"\n--- Starting Video Creation ---")
    create_video_with_moviepy(slide_images, audio_files, video_output_path)
        
    print("\nProcess finished successfully!")

if __name__ == "__main__":
    main()
