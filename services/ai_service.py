import json
import google.generativeai as genai
from config import Config

print(f"🔍 AI Service Init: GOOGLE_API_KEY length = {len(Config.GOOGLE_API_KEY) if Config.GOOGLE_API_KEY else 0}")
print(f"🔍 AI Service Init: Raw key = '{Config.GOOGLE_API_KEY}'")
print(f"🔍 AI Service Init: Starts with AIza = {Config.GOOGLE_API_KEY.startswith('AIza') if Config.GOOGLE_API_KEY else False}")
print(f"🔍 AI Service Init: Starts with AQ. = {Config.GOOGLE_API_KEY.startswith('AQ.') if Config.GOOGLE_API_KEY else False}")
print(f"🔍 AI Service Init: Has valid key = {(Config.GOOGLE_API_KEY.startswith('AIza') or Config.GOOGLE_API_KEY.startswith('AQ.')) if Config.GOOGLE_API_KEY else False}")

# Configure Gemini API
if Config.GOOGLE_API_KEY:
    genai.configure(api_key=Config.GOOGLE_API_KEY)


def generate_quiz_from_topic(topic, num_questions=5):
    """
    Generate a quiz based on a topic using Google Gemini API
    """
    print(f"🔵 generate_quiz_from_topic called with topic='{topic}', num_questions={num_questions}")
    
    if not Config.GOOGLE_API_KEY or not (Config.GOOGLE_API_KEY.startswith('AIza') or Config.GOOGLE_API_KEY.startswith('AQ.')):
        print("⚠️  No valid Google API key, using mock quiz")
        return generate_mock_quiz(topic, num_questions)
    
    try:
        print("🔵 Calling Google Gemini API...")
        
        prompt = f"""Create a quiz with {num_questions} questions about "{topic}".
        
        Return the response in this exact JSON format:
        {{
            "title": "Quiz title",
            "description": "Brief description",
            "questions": [
                {{
                    "question": "Question text",
                    "type": "multiple_choice",
                    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
                    "correct_answer": "A"
                }},
                {{
                    "question": "True or false question?",
                    "type": "true_false",
                    "options": {{"true": "True", "false": "False"}},
                    "correct_answer": "true"
                }},
                ...
            ]
        }}
        
        Make the questions varied and educational. Mix question types between multiple_choice and true_false. For true_false questions, always use exactly this format with options as {{"true": "True", "false": "False"}} and correct_answer as either "true" or "false"."""
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text
        
        print(f"📝 Gemini response received: {response_text[:100]}...")
        
        # Extract JSON from response (Gemini might wrap it in markdown)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        quiz_data = json.loads(response_text)
        
        # Ensure true_false questions have proper options
        for q in quiz_data.get('questions', []):
            if q.get('type') == 'true_false':
                if not q.get('options'):
                    q['options'] = {'true': 'True', 'false': 'False'}
                # Normalize correct_answer to lowercase
                if q.get('correct_answer'):
                    q['correct_answer'] = q['correct_answer'].lower()
        
        print(f"✅ AI Quiz generated with {len(quiz_data.get('questions', []))} questions")
        return quiz_data
        
    except Exception as e:
        print(f"❌ Error generating quiz from topic: {str(e)}")
        import traceback
        traceback.print_exc()
        print("⚠️  Falling back to mock quiz")
        return generate_mock_quiz(topic, num_questions)


def generate_quiz_from_text(text_content, num_questions=5):
    """
    Generate a quiz based on provided text using Google Gemini API
    """
    print(f"🔵 generate_quiz_from_text called with text length={len(text_content)}, num_questions={num_questions}")
    
    if not Config.GOOGLE_API_KEY or not (Config.GOOGLE_API_KEY.startswith('AIza') or Config.GOOGLE_API_KEY.startswith('AQ.')):
        print("⚠️  No valid Google API key, using mock quiz")
        return generate_mock_quiz_from_text(text_content[:500], num_questions)
    
    try:
        # Truncate text if too long
        if len(text_content) > 3000:
            text_content = text_content[:3000]
        
        print("🔵 Calling Google Gemini API for text-based quiz...")
        
        prompt = f"""Based on the following text, create {num_questions} quiz questions:

        TEXT:
        {text_content}
        
        Return the response in this exact JSON format:
        {{
            "title": "Quiz from document",
            "description": "Questions based on the provided document",
            "questions": [
                {{
                    "question": "Question text",
                    "type": "multiple_choice",
                    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
                    "correct_answer": "A"
                }},
                {{
                    "question": "True or false question based on the text?",
                    "type": "true_false",
                    "options": {{"true": "True", "false": "False"}},
                    "correct_answer": "true"
                }},
                ...
            ]
        }}
        
        Make questions that test understanding of the document content. For true_false questions, always use exactly this format with options as {{"true": "True", "false": "False"}} and correct_answer as either "true" or "false"."""
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text
        
        print(f"📝 Gemini response received: {response_text[:100]}...")
        
        # Extract JSON from response (Gemini might wrap it in markdown)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        quiz_data = json.loads(response_text)
        
        # Ensure true_false questions have proper options
        for q in quiz_data.get('questions', []):
            if q.get('type') == 'true_false':
                if not q.get('options'):
                    q['options'] = {'true': 'True', 'false': 'False'}
                # Normalize correct_answer to lowercase
                if q.get('correct_answer'):
                    q['correct_answer'] = q['correct_answer'].lower()
        
        print(f"✅ AI Quiz from text generated with {len(quiz_data.get('questions', []))} questions")
        return quiz_data
    
    except Exception as e:
        print(f"❌ Error generating quiz from text: {str(e)}")
        print("⚠️  Falling back to mock quiz from text")
        return generate_mock_quiz_from_text(text_content[:500], num_questions)


def generate_mock_quiz(topic, num_questions=5):
    """
    Generate diverse mock quiz data (fallback when OpenAI API not available)
    """
    import random
    
    # Topic-specific question templates
    question_templates = {
        "definition": f"What is the best definition of {topic}?",
        "characteristic": f"Which of the following is a key characteristic of {topic}?",
        "history": f"When did {topic} become widely recognized?",
        "application": f"In which field is {topic} most commonly used?",
        "benefit": f"What is a major benefit of {topic}?",
        "challenge": f"What is a significant challenge in {topic}?",
        "technique": f"Which technique is fundamental to {topic}?",
        "expert": f"Who is known as a pioneer in {topic}?",
        "trend": f"What is the current trend in {topic}?",
        "comparison": f"How does {topic} compare to traditional approaches?",
        "future": f"What is the expected future of {topic}?",
        "requirement": f"What skill is essential for {topic}?",
        "impact": f"How has {topic} impacted society?",
        "component": f"Which is a core component of {topic}?",
        "process": f"What is the primary process in {topic}?",
        "standard": f"What is the industry standard for {topic}?",
        "cost": f"What factor most affects the cost of {topic}?",
        "audience": f"Who benefits most from {topic}?",
        "certification": f"What certification is valuable in {topic}?",
        "resource": f"What is the most important resource for {topic}?"
    }
    
    # Varied answer options for different question types
    answer_sets = [
        ["A fundamental concept", "An advanced theory", "A basic principle", "A practical application"],
        ["In education", "In business", "In technology", "In all sectors"],
        ["Cost and complexity", "Time and resources", "Skills and knowledge", "All of the above"],
        ["Improving efficiency", "Reducing errors", "Enhancing quality", "All of the above"],
        ["Recent development", "Well-established", "Emerging trend", "Historical practice"],
        ["5-10 years ago", "10-20 years ago", "Over 20 years ago", "Recently developed"],
        ["Beginner", "Intermediate", "Advanced", "Expert"],
        ["Yes, significantly", "Somewhat", "Minimal impact", "No impact"],
        ["Growing rapidly", "Stable market", "Declining", "Fluctuating"],
        ["Online courses", "Formal education", "Self-study", "Hands-on experience"],
    ]
    
    mock_questions = []
    used_questions = set()
    
    for i in range(min(num_questions, 20)):
        # Select a diverse question template
        question_type = list(question_templates.keys())[i % len(question_templates)]
        question_text = question_templates[question_type]
        
        # Skip if we've already used this question
        if question_text in used_questions:
            continue
        used_questions.add(question_text)
        
        # Select and randomize answer options
        answer_set = answer_sets[i % len(answer_sets)].copy()
        random.shuffle(answer_set)
        
        # Determine correct answer position randomly
        correct_idx = random.randint(0, len(answer_set) - 1)
        correct_answer = chr(65 + correct_idx)  # Convert to A, B, C, D
        
        # Determine question type randomly
        q_type = random.choice(['multiple_choice', 'multiple_choice', 'true_false'])
        
        if q_type == 'true_false':
            question = {
                "question": f"{topic} {random.choice(['is', 'requires', 'involves', 'demands'])} {random.choice(['significant expertise', 'continuous learning', 'practical experience', 'theoretical knowledge'])}.",
                "type": "true_false",
                "options": {"true": "True", "false": "False"},
                "correct_answer": random.choice(["true", "false"])
            }
        else:
            question = {
                "question": question_text,
                "type": "multiple_choice",
                "options": {
                    "A": answer_set[0],
                    "B": answer_set[1],
                    "C": answer_set[2],
                    "D": answer_set[3] if len(answer_set) > 3 else "All of the above"
                },
                "correct_answer": correct_answer
            }
        
        mock_questions.append(question)
        
        if len(mock_questions) >= num_questions:
            break
    
    # If we don't have enough questions, generate more
    while len(mock_questions) < num_questions:
        q_type = random.choice(['multiple_choice', 'true_false'])
        
        if q_type == 'true_false':
            question = {
                "question": f"{topic} is considered {random.choice(['important', 'essential', 'critical', 'valuable'])} in modern times.",
                "type": "true_false",
                "options": {"true": "True", "false": "False"},
                "correct_answer": random.choice(["true", "false"])
            }
        else:
            answer_set = random.choice(answer_sets).copy()
            random.shuffle(answer_set)
            correct_idx = random.randint(0, len(answer_set) - 1)
            question = {
                "question": random.choice(list(question_templates.values())),
                "type": "multiple_choice",
                "options": {
                    "A": answer_set[0],
                    "B": answer_set[1],
                    "C": answer_set[2],
                    "D": answer_set[3] if len(answer_set) > 3 else "All of the above"
                },
                "correct_answer": chr(65 + correct_idx)
            }
        
        mock_questions.append(question)
    
    return {
        "title": f"Quiz: {topic}",
        "description": f"Test your knowledge about {topic}",
        "questions": mock_questions[:num_questions]
    }


def generate_mock_quiz_from_text(text, num_questions=5):
    """
    Generate diverse mock quiz data from text (fallback)
    """
    import random
    
    # Dynamic question templates for document-based quizzes
    question_templates = [
        "What is the main topic discussed in this document?",
        "Which key concept is emphasized throughout?",
        "What is a primary argument presented?",
        "What evidence supports the claims made?",
        "How does the author structure the argument?",
        "What examples are provided to illustrate points?",
        "What is the intended audience for this document?",
        "What are the main takeaways from this content?",
        "Which section contains critical information?",
        "What recommendations are suggested?",
        "How relevant is this information today?",
        "What background knowledge is assumed?",
        "What are the limitations discussed?",
        "How does this relate to current trends?",
        "What further research is recommended?",
        "What are the practical applications?",
        "How comprehensive is the coverage?",
        "What methodology is described?",
        "What conclusions are drawn?",
        "What makes this document unique?"
    ]
    
    # Varied answer options
    answer_choices = [
        ["Comprehensive overview", "Detailed analysis", "Quick reference", "Academic study"],
        ["Introduction and background", "Main analysis and discussion", "Conclusions and recommendations", "All sections equally"],
        ["Quantitative data", "Qualitative examples", "Expert opinions", "All of the above"],
        ["Increased understanding", "Practical solutions", "New perspectives", "All of these"],
        ["Recent development", "Well-established knowledge", "Emerging research", "Historical context"],
        ["Professionals only", "General audience", "Specialists", "Everyone"],
        ["Cost and feasibility", "Time and resources", "Skills required", "All factors"],
        ["Academic", "Business", "Technical", "General"],
        ["Yes, very relevant", "Somewhat relevant", "Limited relevance", "Outdated"],
        ["Beginner level", "Intermediate level", "Advanced level", "Expert level"],
    ]
    
    mock_questions = []
    
    for i in range(min(num_questions, 20)):
        # Select diverse question
        question_text = question_templates[i % len(question_templates)]
        
        # Randomize answer options
        answer_set = answer_choices[i % len(answer_choices)].copy()
        random.shuffle(answer_set)
        correct_idx = random.randint(0, len(answer_set) - 1)
        
        # Mix of true/false and multiple choice
        if i % 3 == 0:
            question = {
                "question": random.choice([
                    "This document provides evidence-based information.",
                    "The content is well-researched and credible.",
                    "Multiple perspectives are presented.",
                    "The document includes practical examples.",
                    "Additional resources are recommended.",
                    "The writing is clear and accessible.",
                    "Key concepts are properly defined.",
                    "The document is current and up-to-date."
                ]),
                "type": "true_false",
                "options": {"true": "True", "false": "False"},
                "correct_answer": random.choice(["true", "false"])
            }
        else:
            question = {
                "question": question_text,
                "type": "multiple_choice",
                "options": {
                    "A": answer_set[0],
                    "B": answer_set[1],
                    "C": answer_set[2],
                    "D": answer_set[3] if len(answer_set) > 3 else "All of the above"
                },
                "correct_answer": chr(65 + correct_idx)
            }
        
        mock_questions.append(question)
    
    return {
        "title": "Quiz from Document",
        "description": "Questions based on the provided document content",
        "questions": mock_questions[:num_questions]
    }
