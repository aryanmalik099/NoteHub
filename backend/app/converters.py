import img2pdf
from PIL import Image
import io

def convert_images_to_pdf(image_files):
    try:
        image_bytes_list = []
        
        for file in image_files:
            try:
                Image.open(file).verify()
                file.seek(0)
                image_bytes_list.append(file.read())
            except Exception as e:
                print(f"Skipping invalid image file {file.filename}: {e}")
                continue

        if not image_bytes_list:
            return None

        pdf_bytes = img2pdf.convert(image_bytes_list)
        
        return io.BytesIO(pdf_bytes)

    except Exception as e:
        print(f"Error during image to PDF conversion: {e}")
        return None