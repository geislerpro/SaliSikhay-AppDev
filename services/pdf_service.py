import PyPDF2

def extract_text_from_pdf(filepath):
    """
    Extract text content from a PDF file
    """
    try:
        text_content = ""
        
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            # Extract text from all pages
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text()
                text_content += "\n"
        
        return text_content.strip()
    
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None


def get_pdf_metadata(filepath):
    """
    Get PDF metadata (number of pages, title, etc.)
    """
    try:
        metadata = {
            'pages': 0,
            'title': None,
            'author': None,
            'subject': None
        }
        
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            metadata['pages'] = len(pdf_reader.pages)
            
            if pdf_reader.metadata:
                metadata['title'] = pdf_reader.metadata.get('/Title')
                metadata['author'] = pdf_reader.metadata.get('/Author')
                metadata['subject'] = pdf_reader.metadata.get('/Subject')
        
        return metadata
    
    except Exception as e:
        print(f"Error reading PDF metadata: {e}")
        return None
