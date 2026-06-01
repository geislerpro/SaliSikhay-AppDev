import json
import re
import requests
from config import Config

print(f"🔍 AI Service Init: GOOGLE_API_KEY length = {len(Config.GOOGLE_API_KEY) if Config.GOOGLE_API_KEY else 0}")
print(f"🔍 AI Service Init: Raw key = '{Config.GOOGLE_API_KEY}'")
print(f"🔍 AI Service Init: Starts with AIza = {Config.GOOGLE_API_KEY.startswith('AIza') if Config.GOOGLE_API_KEY else False}")
print(f"🔍 AI Service Init: Starts with AQ. = {Config.GOOGLE_API_KEY.startswith('AQ.') if Config.GOOGLE_API_KEY else False}")
print(f"🔍 AI Service Init: Has valid key = {(Config.GOOGLE_API_KEY.startswith('AIza') or Config.GOOGLE_API_KEY.startswith('AQ.')) if Config.GOOGLE_API_KEY else False}")


def _call_gemini_api(prompt, model='gemini-3.5-flash', temperature=0.2, max_output_tokens=800, top_p=0.95, top_k=40):
    if not Config.GOOGLE_API_KEY:
        raise RuntimeError("Google API key missing or invalid.")

    url = (
        f"https://generativelanguage.googleapis.com/v1/models/"
        f"{model}:generateContent?key={Config.GOOGLE_API_KEY}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "topP": top_p,
            "topK": top_k
        }
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers, timeout=60)
    response.raise_for_status()

    result = response.json()

    try:
        return result["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError, TypeError):
        raise ValueError(f"Unexpected Gemini response format: {result}")


def _extract_json_from_text(text):
    if not text:
        raise ValueError("Empty response")

    # remove markdown
    text = text.replace("```json", "").replace("```", "").strip()

    # find first full JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in response:\n{text}")

    json_str = match.group()

    # FINAL SAFE PARSE HERE (important!)
    return json.loads(json_str)


def _validate_quiz_data(quiz_data):
    if not isinstance(quiz_data, dict):
        return False
    questions = quiz_data.get('questions')
    if not isinstance(questions, list) or len(questions) == 0:
        return False
    for q in questions:
        if not isinstance(q, dict):
            return False
        if not q.get('question') or not q.get('type') or not q.get('correct_answer'):
            return False
        q_type = q.get('type')
        if q_type == 'multiple_choice':
            options = q.get('options')
            if not isinstance(options, dict) or len(options) < 3:
                return False
            correct_answer = str(q.get('correct_answer'))
            if correct_answer not in options and correct_answer.upper() not in options:
                return False
        elif q_type == 'true_false':
            options = q.get('options')
            if not isinstance(options, dict) or 'true' not in options or 'false' not in options:
                return False
            if str(q.get('correct_answer')).lower() not in ['true', 'false']:
                return False
    return True


def _normalize_question(q):
    if not isinstance(q, dict):
        return q
    normalized = dict(q)
    q_type = q.get('type')
    options = q.get('options')
    correct_answer = q.get('correct_answer')

    if q_type == 'multiple_choice':
        normalized_options = {}
        if isinstance(options, list):
            for idx, value in enumerate(options[:4]):
                normalized_options[chr(65 + idx)] = str(value).strip()
        elif isinstance(options, dict):
            # Preserve A-D labels when present, otherwise assign sequential letters
            sequential = []
            for key, value in options.items():
                if isinstance(key, str) and key.strip().upper() in ['A', 'B', 'C', 'D']:
                    normalized_options[key.strip().upper()] = str(value).strip()
                else:
                    sequential.append(str(value).strip())
            for idx, value in enumerate(sequential, start=len(normalized_options)):
                if idx < 4:
                    normalized_options[chr(65 + idx)] = value
        if normalized_options:
            normalized['options'] = normalized_options
            answer = str(correct_answer).strip() if correct_answer is not None else ''
            if answer.upper() in normalized_options:
                normalized['correct_answer'] = answer.upper()
            else:
                cleaned = re.sub(r'^[A-Da-d][\).\s]*', '', answer).strip().lower()
                for key, value in normalized_options.items():
                    if cleaned == str(value).strip().lower():
                        normalized['correct_answer'] = key
                        break
    elif q_type == 'true_false':
        normalized_options = {'true': 'True', 'false': 'False'}
        if isinstance(options, dict):
            normalized_options['true'] = str(options.get('true', 'True')).strip()
            normalized_options['false'] = str(options.get('false', 'False')).strip()
        normalized['options'] = normalized_options
        answer = str(correct_answer).strip().lower() if correct_answer is not None else ''
        if answer in ['true', 't', 'yes', 'y', '1']:
            normalized['correct_answer'] = 'true'
        elif answer in ['false', 'f', 'no', 'n', '0']:
            normalized['correct_answer'] = 'false'
        else:
            if answer == normalized_options['true'].strip().lower():
                normalized['correct_answer'] = 'true'
            elif answer == normalized_options['false'].strip().lower():
                normalized['correct_answer'] = 'false'
    return normalized


def generate_quiz_from_topic(topic, num_questions=5):
    """
    Generate a quiz based on a topic using Google Gemini API
    """
    print(f"🔵 generate_quiz_from_topic called with topic='{topic}', num_questions={num_questions}")
    
    if not Config.GOOGLE_API_KEY:
        raise RuntimeError('Google API key missing or invalid. AI quiz generation is disabled.')
    
    try:
        print("🔵 Calling Google Gemini API...")
        
        prompt = f"""You are an expert educational content author. Create {num_questions} high-quality quiz questions about the subject \"{topic}\".
        CRITICAL RULES:
            - Use double quotes for ALL strings and keys
            - Do not use single quotes
            - Do not add trailing commas
            - Output must be valid JSON parsable by Python json.loads()
            - Do not include JavaScript or Python syntax
            - Do not include comments
        Return only valid JSON using this exact schema:
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
                    "question": "Question text",
                    "type": "true_false",
                    "options": {{"true": "True", "false": "False"}},
                    "correct_answer": "true"
                }}
            ]
        }}
        
        Use a mix of multiple_choice and true_false questions.
        For multiple_choice questions provide four distinct, plausible answer choices.
        For true_false questions use exactly: {{"true": "True", "false": "False"}}.
        Set correct_answer to one of "A", "B", "C", "D" for multiple_choice or "true"/"false" for true_false.
        Return exactly {num_questions} questions in the questions list.
        Make every question clearly about the topic, not just a keyword rewrite of the topic.
        Create full, meaningful answer options and mark the correct answer clearly.
        Do not include any markdown, comments, or extra text outside the JSON object."""
        
        response_text = _call_gemini_api(prompt, model='gemini-3.5-flash', temperature=0.2, max_output_tokens=4000)
        print(f"📝 Gemini response received: {response_text}...")
        
        quiz_data = _extract_json_from_text(response_text)
        quiz_data['questions'] = [_normalize_question(q) for q in quiz_data.get('questions', [])]
        
        if len(quiz_data.get('questions', [])) != num_questions:
            raise ValueError(f'AI returned {len(quiz_data.get("questions", []))} questions instead of {num_questions}')
        if not _validate_quiz_data(quiz_data):
            raise ValueError('Invalid quiz JSON from AI')

        topic_lower = topic.lower()
        topic_terms = [w for w in re.findall(r"\w+", topic_lower) if len(w) > 3 and w not in {'about','from','with','your','this','that','from','into','over','under','before','after','within','through'}]
        if not topic_terms:
            topic_terms = [topic_lower]
        related_question_count = sum(
            1 for q in quiz_data.get('questions', [])
            if any(term in q.get('question', '').lower() for term in topic_terms)
        )
        if related_question_count < max(1, num_questions // 2):
            print('⚠️ Topic relevance low, retrying with stronger topic constraints')
            retry_prompt = prompt + '\n\nRegenerate the quiz now, ensuring every question uses the topic or primary topic keywords in the question text.'
            retry_text = _call_gemini_api(retry_prompt, model='gemini-3.5-flash', temperature=0.1, max_output_tokens=4000)
            print(f"📝 Gemini retry response received: {retry_text[:100]}...")
            quiz_data = _extract_json_from_text(retry_text)
            quiz_data['questions'] = [_normalize_question(q) for q in quiz_data.get('questions', [])]
            if len(quiz_data.get('questions', [])) != num_questions:
                raise ValueError(f'AI retry returned {len(quiz_data.get("questions", []))} questions instead of {num_questions}')
            if not _validate_quiz_data(quiz_data):
                raise ValueError('Invalid quiz JSON from AI after retry')

        # Ensure true_false questions have proper options
        for q in quiz_data.get('questions', []):
            if q.get('type') == 'true_false':
                if not q.get('options'):
                    q['options'] = {'true': 'True', 'false': 'False'}
                if q.get('correct_answer'):
                    q['correct_answer'] = q['correct_answer'].lower()
        
        print(f"✅ AI Quiz generated with {len(quiz_data.get('questions', []))} questions")
        return quiz_data
        
    except Exception as e:
        print(f"❌ Error generating quiz from topic: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def generate_quiz_from_text(text_content, num_questions=5):
    """
    Generate a quiz based on provided text using Google Gemini API
    """
    print(f"🔵 generate_quiz_from_text called with text length={len(text_content)}, num_questions={num_questions}")
    
    if not Config.GOOGLE_API_KEY:
        raise RuntimeError('Google API key missing or invalid. AI quiz generation is disabled.')
    
    try:
        # Truncate text if too long
        if len(text_content) > 3000:
            text_content = text_content[:3000]
        
        print("🔵 Calling Google Gemini API for text-based quiz...")
        
        prompt = f"""You are an expert educational content author. Based on the following text, create {num_questions} high-quality quiz questions:

        TEXT:
        {text_content}
        
        Return only valid JSON using this exact schema:
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
                    "question": "Question text",
                    "type": "true_false",
                    "options": {{"true": "True", "false": "False"}},
                    "correct_answer": "true"
                }}
            ]
        }}
        
        Use a mix of multiple_choice and true_false questions.
        For multiple_choice questions provide four distinct, plausible answer choices.
        For true_false questions use exactly: {{"true": "True", "false": "False"}}.
        Set correct_answer to one of "A", "B", "C", "D" for multiple_choice or "true"/"false" for true_false.
        Return exactly {num_questions} questions in the questions list.
        Make every question clearly based on the provided text and avoid unrelated details.
        Do not include any markdown, comments, or extra text outside the JSON object."""
        
        response_text = _call_gemini_api(prompt, model='gemini-3.5-flash', temperature=0.2, max_output_tokens=900)
        print(f"📝 Gemini response received: {response_text[:100]}...")
        
        response_text = _extract_json_from_text(response_text)
        quiz_data = json.loads(response_text)
        quiz_data['questions'] = [_normalize_question(q) for q in quiz_data.get('questions', [])]
        
        if len(quiz_data.get('questions', [])) != num_questions:
            raise ValueError(f'AI returned {len(quiz_data.get("questions", []))} questions instead of {num_questions}')
        if not _validate_quiz_data(quiz_data):
            raise ValueError('Invalid quiz JSON from AI')

        related_question_count = sum(1 for q in quiz_data.get('questions', []) if 'question' in q and any(term in q['question'].lower() for term in ['topic', 'text', 'document', 'passage', 'chapter', 'subject']))
        if related_question_count < max(1, num_questions // 2):
            print('⚠️ Document relevance low, retrying with stronger document focus')
            retry_prompt = prompt + '\n\nRegenerate the quiz now, ensuring every question is clearly based on the provided document text and nothing else.'
            retry_text = _call_gemini_api(retry_prompt, model='gemini-3.5-flash', temperature=0.1, max_output_tokens=900)
            print(f"📝 Gemini retry response received: {retry_text[:100]}...")
            retry_text = _extract_json_from_text(retry_text)
            quiz_data = json.loads(retry_text)
            quiz_data['questions'] = [_normalize_question(q) for q in quiz_data.get('questions', [])]
            if len(quiz_data.get('questions', [])) != num_questions:
                raise ValueError(f'AI retry returned {len(quiz_data.get("questions", []))} questions instead of {num_questions}')
            if not _validate_quiz_data(quiz_data):
                raise ValueError('Invalid quiz JSON from AI after retry')

        # Ensure true_false questions have proper options
        for q in quiz_data.get('questions', []):
            if q.get('type') == 'true_false':
                if not q.get('options'):
                    q['options'] = {'true': 'True', 'false': 'False'}
                if q.get('correct_answer'):
                    q['correct_answer'] = q['correct_answer'].lower()
        
        print(f"✅ AI Quiz from text generated with {len(quiz_data.get('questions', []))} questions")
        return quiz_data
    
    except Exception as e:
        print(f"❌ Error generating quiz from text: {str(e)}")
        raise


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
    topic_label = topic.strip().capitalize() if topic else 'This topic'
    answer_sets = [
        [
            f"{topic_label} is best described as a key idea or process.",
            f"{topic_label} is primarily a historical event.",
            f"{topic_label} is only used in one industry.",
            f"{topic_label} is an unrelated entertainment concept."
        ],
        [
            f"A common application of {topic_label} is in problem-solving.",
            f"A common application of {topic_label} is in cooking recipes.",
            f"A common application of {topic_label} is in fiction writing.",
            f"A common application of {topic_label} is in an unrelated sport."
        ],
        [
            f"{topic_label} usually involves analysis and reasoning.",
            f"{topic_label} requires no planning at all.",
            f"{topic_label} is mainly about finding hidden treasure.",
            f"{topic_label} is only about memorizing dates."
        ],
        [
            f"{topic_label} is generally considered important in modern education.",
            f"{topic_label} is only for beginner hobbyists.",
            f"{topic_label} is unrelated to professional practice.",
            f"{topic_label} is only used for entertainment purposes."
        ],
        [
            f"{topic_label} often improves efficiency or understanding.",
            f"{topic_label} always makes things slower.",
            f"{topic_label} is purely decorative.",
            f"{topic_label} is mainly a marketing slogan."
        ],
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
