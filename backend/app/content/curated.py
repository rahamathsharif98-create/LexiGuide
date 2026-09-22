"""Curated educational learning content catalog for Step 18."""
from typing import List, Optional, Dict
from app.content.base import (
    ContentItemModel,
    ContentSourceType,
    ContentType,
    ComprehensionQuestion,
    QuestionOption,
)

CURATED_CATALOG_DATA: List[dict] = [
    # 1. Reading Passages
    {
        "id": "passage-pet-cat",
        "title": "My Pet Cat",
        "description": "Read a cheerful story about a playful kitten chasing a red ball.",
        "content_type": ContentType.READING.value,
        "category": "Reading",
        "skill": "reading_fluency",
        "secondary_skills": ["comprehension", "word_recognition"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-7",
        "age_min": 5,
        "age_max": 7,
        "estimated_minutes": 4,
        "prerequisites": [],
        "tags": ["cat", "pet", "animals", "ball", "kitten", "easy reading", "play"],
        "language": "en",
        "activity_type": "reading",
        "learning_objective": "Read simple 3-word to 5-word sentences with confidence.",
        "reinforcement_target": "Early sentence flow",
        "challenge_level": "supportive",
        "route": "/child/read",
        "icon": "🐱",
        "source_type": ContentSourceType.CURATED.value,
        "passage": "I have a pet cat. The cat is soft and white. The cat likes to play with a red ball.",
        "expected_text": "I have a pet cat. The cat is soft and white. The cat likes to play with a red ball.",
        "questions": [
            {
                "q": "What pet does the child have?",
                "options": [{"text": "A dog", "emoji": "🐶"}, {"text": "A cat", "emoji": "🐱"}, {"text": "A bird", "emoji": "🐦"}],
                "answer": "A cat",
            },
            {
                "q": "What color is the ball?",
                "options": [{"text": "Blue", "emoji": "🔵"}, {"text": "Red", "emoji": "🔴"}, {"text": "Green", "emoji": "🟢"}],
                "answer": "Red",
            }
        ],
    },
    {
        "id": "passage-big-race",
        "title": "The Big Race",
        "description": "Read about the determined turtle and the speedy rabbit in a friendly race.",
        "content_type": ContentType.READING.value,
        "category": "Reading",
        "skill": "reading_fluency",
        "secondary_skills": ["comprehension"],
        "difficulty": 3,
        "difficulty_label": "Medium",
        "age_range": "7-10",
        "age_min": 7,
        "age_max": 10,
        "estimated_minutes": 7,
        "prerequisites": ["passage-pet-cat"],
        "tags": ["turtle", "rabbit", "race", "animals", "fast", "fable", "challenge"],
        "language": "en",
        "activity_type": "reading",
        "learning_objective": "Read multi-syllable narrative sentences smoothly.",
        "reinforcement_target": "Multi-clause sentence fluency",
        "challenge_level": "stretch",
        "route": "/child/read",
        "icon": "🐢",
        "source_type": ContentSourceType.CURATED.value,
        "passage": "The swift rabbit darted past the meadow. The patient turtle kept walking forward steadily. With persistence and focus, the turtle reached the finish line first.",
        "expected_text": "The swift rabbit darted past the meadow. The patient turtle kept walking forward steadily. With persistence and focus, the turtle reached the finish line first.",
        "questions": [
            {
                "q": "Who ran past the meadow?",
                "options": [{"text": "The rabbit", "emoji": "🐇"}, {"text": "The fox", "emoji": "🦊"}, {"text": "The bear", "emoji": "🐻"}],
                "answer": "The rabbit",
            },
            {
                "q": "Who won the race?",
                "options": [{"text": "The turtle", "emoji": "🐢"}, {"text": "The bird", "emoji": "🐦"}, {"text": "The rabbit", "emoji": "🐇"}],
                "answer": "The turtle",
            }
        ],
    },

    # 2. Stories
    {
        "id": "story-forest",
        "title": "The Curious Fox",
        "description": "Explore the forest with Sam the fox and answer questions about his shiny stone.",
        "content_type": ContentType.STORY.value,
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["reading_fluency"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 6,
        "prerequisites": [],
        "tags": ["fox", "forest", "animals", "stone", "story", "nature", "sam"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Answer literal questions about main characters and setting.",
        "reinforcement_target": "Literal recall and character identification",
        "challenge_level": "supportive",
        "route": "/child/stories/story-forest",
        "icon": "🦊",
        "source_type": ContentSourceType.CURATED.value,
        "passage": [
            "Once there was a curious fox named Sam.",
            "Sam loved to explore the green, quiet forest.",
            "One sunny day, Sam found a shiny blue stone.",
            "The stone sparkled like a little star.",
            "Sam carried it home to show all his friends."
        ],
        "expected_text": "Once there was a curious fox named Sam. Sam loved to explore the green, quiet forest. One sunny day, Sam found a shiny blue stone. The stone sparkled like a little star. Sam carried it home to show all his friends.",
        "questions": [
            {
                "q": "What was the fox's name?",
                "options": [{"text": "Sam", "emoji": "🦊"}, {"text": "Max", "emoji": "🐺"}, {"text": "Tom", "emoji": "🐱"}],
                "answer": "Sam",
            },
            {
                "q": "What color was the stone?",
                "options": [{"text": "Red", "emoji": "🔴"}, {"text": "Blue", "emoji": "🔵"}, {"text": "Green", "emoji": "🟢"}],
                "answer": "Blue",
            },
            {
                "q": "Where did Sam love to explore?",
                "options": [{"text": "The beach", "emoji": "🏖️"}, {"text": "The forest", "emoji": "🌲"}, {"text": "The city", "emoji": "🏙️"}],
                "answer": "The forest",
            },
        ],
    },
    {
        "id": "story-space",
        "title": "A Trip to the Moon",
        "description": "Travel to the stars with Priya and answer questions about her imaginative journey.",
        "content_type": ContentType.STORY.value,
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["reading_fluency"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "age_min": 6,
        "age_max": 9,
        "estimated_minutes": 8,
        "prerequisites": ["story-forest"],
        "tags": ["space", "moon", "rocket", "priya", "stars", "adventure", "story"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Answer sequencing and inference questions from narrative text.",
        "reinforcement_target": "Inferential comprehension and story sequence",
        "challenge_level": "standard",
        "route": "/child/stories/story-space",
        "icon": "🚀",
        "source_type": ContentSourceType.CURATED.value,
        "passage": [
            "Priya dreamed of flying to the moon.",
            "She built a rocket from cardboard and paint.",
            "At night, the stars twinkled above her window.",
            "In her dream, the rocket zoomed past the clouds.",
            "She landed softly on the silver, dusty moon."
        ],
        "expected_text": "Priya dreamed of flying to the moon. She built a rocket from cardboard and paint. At night, the stars twinkled above her window. In her dream, the rocket zoomed past the clouds. She landed softly on the silver, dusty moon.",
        "questions": [
            {
                "q": "What did Priya build?",
                "options": [{"text": "A rocket", "emoji": "🚀"}, {"text": "A boat", "emoji": "⛵"}, {"text": "A kite", "emoji": "🪁"}],
                "answer": "A rocket",
            },
            {
                "q": "Where did she land?",
                "options": [{"text": "The sun", "emoji": "☀️"}, {"text": "The moon", "emoji": "🌙"}, {"text": "A star", "emoji": "⭐"}],
                "answer": "The moon",
            }
        ],
    },
    {
        "id": "story-garden",
        "title": "The Tiny Seed",
        "description": "A tiny seed grows into a bright yellow flower under the warm sunshine.",
        "content_type": ContentType.STORY.value,
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["word_recognition"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["seed", "flower", "garden", "nature", "sun", "rain"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Track steps in a growth sequence from a simple story.",
        "reinforcement_target": "Sequential recall",
        "challenge_level": "supportive",
        "route": "/child/stories/story-garden",
        "icon": "🌱",
        "source_type": ContentSourceType.CURATED.value,
        "passage": [
            "A tiny seed lived under the warm brown soil.",
            "Rain fell softly and the seed began to grow.",
            "A small green shoot pushed up toward the sun.",
            "Day by day, the plant grew taller and taller.",
            "Soon a bright yellow flower bloomed in the garden."
        ],
        "expected_text": "A tiny seed lived under the warm brown soil. Rain fell softly and the seed began to grow. A small green shoot pushed up toward the sun. Day by day, the plant grew taller and taller. Soon a bright yellow flower bloomed in the garden.",
        "questions": [
            {
                "q": "Where did the seed live?",
                "options": [{"text": "Under the soil", "emoji": "🌱"}, {"text": "In a box", "emoji": "📦"}, {"text": "In the water", "emoji": "💧"}],
                "answer": "Under the soil",
            },
            {
                "q": "What color was the bloom?",
                "options": [{"text": "Yellow", "emoji": "💛"}, {"text": "Red", "emoji": "❤️"}, {"text": "Blue", "emoji": "💙"}],
                "answer": "Yellow",
            }
        ],
    },

    # 3. Phonics & Sound Activities
    {
        "id": "act-sound-safari",
        "title": "Sound Safari",
        "description": "Listen to wild animal calls and match the starting phoneme sound.",
        "content_type": ContentType.SOUND.value,
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "phonics", "safari", "animals", "lion", "phoneme", "listening"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Identify initial phonemes in common animal names.",
        "reinforcement_target": "Initial phoneme discrimination",
        "challenge_level": "standard",
        "route": "/child/games/match-sound",
        "icon": "🦁",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["lion", "monkey", "elephant", "tiger"],
    },
    {
        "id": "act-letter-detective",
        "title": "Letter Detective",
        "description": "Hunt for mystery letters and identify sounds hiding inside words.",
        "content_type": ContentType.PHONICS.value,
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["word_recognition"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "age_min": 6,
        "age_max": 9,
        "estimated_minutes": 6,
        "prerequisites": ["act-sound-safari"],
        "tags": ["detective", "letters", "sounds", "phonics", "mystery", "investigate"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Distinguish medial and ending consonant sounds in words.",
        "reinforcement_target": "Medial phoneme blending",
        "challenge_level": "standard",
        "route": "/child/games/find-sound",
        "icon": "🔍",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["cat", "dog", "sun", "map", "pin"],
    },

    # 4. Word & Spelling Activities
    {
        "id": "act-word-builder",
        "title": "Word Builder",
        "description": "Rearrange spelling blocks to build target sight words and syllables.",
        "content_type": ContentType.SPELLING.value,
        "category": "Games",
        "skill": "word_recognition",
        "secondary_skills": ["phonological_awareness"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "age_min": 6,
        "age_max": 9,
        "estimated_minutes": 7,
        "prerequisites": [],
        "tags": ["puzzle", "spelling", "words", "letters", "blocks", "phonics"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Assemble 3 to 4 letter words from consonant-vowel-consonant blocks.",
        "reinforcement_target": "CVC word construction",
        "challenge_level": "standard",
        "route": "/child/games/build-word",
        "icon": "🧩",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["bat", "frog", "jump", "star", "tree"],
    },
    {
        "id": "act-picture-match",
        "title": "Picture Match",
        "description": "Connect vibrant pictures with their matching written vocabulary words.",
        "content_type": ContentType.VOCABULARY.value,
        "category": "Games",
        "skill": "word_recognition",
        "secondary_skills": ["comprehension"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["picture", "match", "cards", "sight words", "memory", "reading"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Recognize high-frequency sight words with visual picture cues.",
        "reinforcement_target": "Sight word visual association",
        "challenge_level": "supportive",
        "route": "/child/games/picture-word",
        "icon": "🖼️",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["apple", "ball", "car", "duck", "egg"],
    },

    # 5. Speaking Practice
    {
        "id": "act-speak-and-shine",
        "title": "Speak & Shine",
        "description": "Speak clear target words aloud and receive instant friendly pronunciation guidance.",
        "content_type": ContentType.SPEAKING.value,
        "category": "Speaking",
        "skill": "pronunciation",
        "secondary_skills": ["phonological_awareness"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-9",
        "age_min": 5,
        "age_max": 9,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["speak", "speech", "pronunciation", "talk", "voice", "microphone", "words"],
        "language": "en",
        "activity_type": "speaking",
        "learning_objective": "Articulate clear consonant and vowel phonemes in key vocabulary words.",
        "reinforcement_target": "Phoneme clarity & articulation",
        "challenge_level": "standard",
        "route": "/child/speak",
        "icon": "🎤",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["sun", "ship", "star", "tree", "river"],
    },

    # 6. Multilingual Content
    {
        "id": "act-sound-safari-hi",
        "title": "Sound Safari (Hindi Sounds)",
        "description": "Listen to animal sounds and match starting Hindi varnamala letters.",
        "content_type": ContentType.SOUND.value,
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "hindi", "safari", "animals", "varnamala", "listening"],
        "language": "hi",
        "activity_type": "game",
        "learning_objective": "Identify beginning Hindi phonemes with animal prompts.",
        "reinforcement_target": "Hindi letter sound matching",
        "challenge_level": "standard",
        "route": "/child/games/match-sound?lang=hi",
        "icon": "🦁",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["शेर", "हाथी", "भालू"],
    },
    {
        "id": "act-sound-safari-te",
        "title": "Sound Safari (Telugu Sounds)",
        "description": "Listen to animal sounds and match starting Telugu aksharamulu letters.",
        "content_type": ContentType.SOUND.value,
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "age_min": 5,
        "age_max": 8,
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "telugu", "safari", "animals", "aksharamulu", "listening"],
        "language": "te",
        "activity_type": "game",
        "learning_objective": "Identify beginning Telugu phonemes with animal prompts.",
        "reinforcement_target": "Telugu letter sound matching",
        "challenge_level": "standard",
        "route": "/child/games/match-sound?lang=te",
        "icon": "🦁",
        "source_type": ContentSourceType.CURATED.value,
        "vocabulary_words": ["సింహం", "ఏనుగు", "ఎలుగుబంటి"],
    },
]


def _parse_curated_item(data: dict) -> ContentItemModel:
    raw_questions = data.get("questions")
    parsed_questions = None
    if raw_questions:
        parsed_questions = []
        for q in raw_questions:
            opts = [QuestionOption(text=o["text"], emoji=o.get("emoji")) for o in q["options"]]
            parsed_questions.append(
                ComprehensionQuestion(
                    id=q.get("id"),
                    q=q["q"],
                    options=opts,
                    answer=q["answer"],
                )
            )

    return ContentItemModel(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        content_type=data["content_type"],
        category=data["category"],
        skill=data["skill"],
        secondary_skills=data.get("secondary_skills", []),
        difficulty=data.get("difficulty", 2),
        difficulty_label=data.get("difficulty_label", "Easy"),
        age_range=data.get("age_range", "5-8"),
        age_min=data.get("age_min", 4),
        age_max=data.get("age_max", 10),
        estimated_minutes=data.get("estimated_minutes", 5),
        prerequisites=data.get("prerequisites", []),
        tags=data.get("tags", []),
        language=data.get("language", "en"),
        activity_type=data.get("activity_type", "game"),
        learning_objective=data.get("learning_objective", "Literacy practice"),
        reinforcement_target=data.get("reinforcement_target"),
        prerequisite_skill=data.get("prerequisite_skill"),
        challenge_level=data.get("challenge_level", "standard"),
        route=data["route"],
        icon=data.get("icon", "✨"),
        source_type=data.get("source_type", ContentSourceType.CURATED.value),
        passage=data.get("passage"),
        expected_text=data.get("expected_text"),
        questions=parsed_questions,
        vocabulary_words=data.get("vocabulary_words"),
    )


class CuratedContentRepository:
    def __init__(self):
        self._items: Dict[str, ContentItemModel] = {}
        for d in CURATED_CATALOG_DATA:
            parsed = _parse_curated_item(d)
            self._items[parsed.id] = parsed

    def get_all(self) -> List[ContentItemModel]:
        return list(self._items.values())

    def get_by_id(self, item_id: str) -> Optional[ContentItemModel]:
        return self._items.get(item_id)

    def filter(
        self,
        skill: Optional[str] = None,
        difficulty: Optional[int] = None,
        content_type: Optional[str] = None,
        language: Optional[str] = None,
        age: Optional[int] = None,
    ) -> List[ContentItemModel]:
        results = []
        for item in self._items.values():
            if skill and item.skill != skill and skill not in item.secondary_skills:
                continue
            if difficulty and item.difficulty != difficulty:
                continue
            if content_type and item.content_type != content_type:
                continue
            if language and item.language != language:
                continue
            if age is not None:
                if not (item.age_min <= age <= item.age_max):
                    continue
            results.append(item)
        return results


curated_repository = CuratedContentRepository()
