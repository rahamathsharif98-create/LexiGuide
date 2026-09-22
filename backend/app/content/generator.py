"""Controlled educational content generator and assembler for LexiGuide."""
import hashlib
from typing import Dict, List, Optional
from app.content.base import (
    ContentItemModel,
    ContentSourceType,
    ContentType,
    ContentGenerationRequest,
    ComprehensionQuestion,
    QuestionOption,
)

# Pedagogical templates organized by [content_type][topic][difficulty]
TOPIC_ICONS = {
    "animals": "🐾",
    "space": "🚀",
    "adventure": "🧭",
    "nature": "🌿",
    "science": "🔬",
    "friendship": "🤝",
    "school": "🎒",
    "sports": "⚽",
    "everyday": "☀️",
}

DIFFICULTY_LABELS_MAP = {
    1: "Easy",
    2: "Easy",
    3: "Medium",
    4: "Challenging",
}

# Controlled pedagogical templates ensuring age safety, non-clinical phrasing, and answer consistency
TEMPLATES: Dict[str, Dict[str, Dict[int, dict]]] = {
    "reading": {
        "animals": {
            1: {
                "title": "A Little Puppy",
                "passage": "I see a little puppy. The puppy has brown spots. The puppy runs fast in the yard.",
                "objective": "Read simple 3-word to 5-word sentences about animals with confidence.",
                "q": "What animal does the child see?",
                "options": [{"text": "A puppy", "emoji": "🐶"}, {"text": "A bird", "emoji": "🐦"}, {"text": "A frog", "emoji": "🐸"}],
                "ans": "A puppy",
                "vocab": ["puppy", "little", "spots", "fast"],
            },
            2: {
                "title": "The Friendly Dolphin",
                "passage": "A friendly dolphin swam near the blue ocean shore. She leaped high into the sunny air. She clicked softly to her baby.",
                "objective": "Practice reading narrative sentences with compound words and blends.",
                "q": "Where did the dolphin swim?",
                "options": [{"text": "Near the shore", "emoji": "🌊"}, {"text": "In a pond", "emoji": "🏞️"}, {"text": "Under a rock", "emoji": "🪨"}],
                "ans": "Near the shore",
                "vocab": ["dolphin", "ocean", "shore", "leaped"],
            },
            3: {
                "title": "The Forest Owl",
                "passage": "At twilight, a wise owl perched quietly on an oak branch. Her sharp amber eyes scanned the silent grass below. When the wind whistled, she glided gracefully across the moonlit meadow.",
                "objective": "Read multi-clause descriptive passages with expressive cadence.",
                "q": "Where did the owl perch?",
                "options": [{"text": "On an oak branch", "emoji": "🌳"}, {"text": "On a fence", "emoji": "🪵"}, {"text": "In a cave", "emoji": "🪨"}],
                "ans": "On an oak branch",
                "vocab": ["twilight", "perched", "amber", "meadow"],
            },
            4: {
                "title": "Arctic Journey of the Polar Bear",
                "passage": "Across vast glacial expanses, a mother polar bear navigated shifting ice shelves. She taught her curious twin cubs to track scent trails and navigate frigid coastal currents, ensuring their survival in the northern wilderness.",
                "objective": "Comprehend complex informational text featuring advanced vocabulary and cause-effect reasoning.",
                "q": "What did the mother polar bear teach her cubs?",
                "options": [{"text": "Track scent trails", "emoji": "🐾"}, {"text": "Climb trees", "emoji": "🌲"}, {"text": "Fly high", "emoji": "🦅"}],
                "ans": "Track scent trails",
                "vocab": ["glacial", "navigated", "scent trails", "frigid"],
            },
        },
        "space": {
            1: {
                "title": "Bright Little Star",
                "passage": "Look up at the sky. A bright star shines at night. The star twinkles like a gem.",
                "objective": "Read foundational high-frequency sight words with visual cues.",
                "q": "When does the star shine?",
                "options": [{"text": "At night", "emoji": "🌙"}, {"text": "At noon", "emoji": "☀️"}, {"text": "At dawn", "emoji": "🌅"}],
                "ans": "At night",
                "vocab": ["star", "sky", "night", "bright"],
            },
            2: {
                "title": "Roving on Mars",
                "passage": "A robotic rover rolled over red dusty rocks. It took clear photographs of ancient valleys and sent radio signals back to Earth.",
                "objective": "Practice multisyllabic science vocabulary and oral reading fluency.",
                "q": "What did the rover take photographs of?",
                "options": [{"text": "Ancient valleys", "emoji": "🌄"}, {"text": "Green trees", "emoji": "🌲"}, {"text": "Deep oceans", "emoji": "🌊"}],
                "ans": "Ancient valleys",
                "vocab": ["rover", "photographs", "signals", "valleys"],
            },
            3: {
                "title": "Journey Beyond the Rings",
                "passage": "The spacecraft glided toward Saturn's shimmering ring system. Billions of icy particles orbited in breathtaking bands, reflecting golden sunlight across deep space.",
                "objective": "Read descriptive astronomy texts with smooth phrasing and pausing.",
                "q": "What orbited in breathtaking bands?",
                "options": [{"text": "Icy particles", "emoji": "🧊"}, {"text": "Hot lava", "emoji": "🌋"}, {"text": "Green plants", "emoji": "🌱"}],
                "ans": "Icy particles",
                "vocab": ["spacecraft", "particles", "shimmering", "orbited"],
            },
            4: {
                "title": "The Solar Observatory",
                "passage": "Deep in space, solar observatories monitor intense coronal loops and plasma emissions. By analyzing electromagnetic radiation across diverse wavelengths, scientists predict geomagnetic storms and protect satellite communications.",
                "objective": "Master advanced informational reading strategies across domain-specific scientific narratives.",
                "q": "What do solar observatories monitor?",
                "options": [{"text": "Coronal loops and plasma emissions", "emoji": "☀️"}, {"text": "Ocean currents", "emoji": "🌊"}, {"text": "Desert winds", "emoji": "🏜️"}],
                "ans": "Coronal loops and plasma emissions",
                "vocab": ["observatory", "coronal", "electromagnetic", "geomagnetic"],
            },
        },
    },
    "story": {
        "animals": {
            1: {
                "title": "Leo the Friendly Cub",
                "passage": "Leo was a cheerful lion cub. Leo played with a yellow leaf. When the wind blew, the leaf floated away. Leo giggled and chased it across the warm grass.",
                "objective": "Follow short narrative events and identify key characters.",
                "q": "What did Leo play with?",
                "options": [{"text": "A yellow leaf", "emoji": "🍂"}, {"text": "A red ball", "emoji": "🔴"}, {"text": "A wooden stick", "emoji": "🪵"}],
                "ans": "A yellow leaf",
                "vocab": ["cub", "cheerful", "floated", "giggled"],
            },
            2: {
                "title": "Maya and the River Otter",
                "passage": "Maya walked along the sunny riverbank after school. Suddenly, an otter popped its head above the water with a shiny green shell. Maya waved gently, and the otter did a joyful backflip before diving deep.",
                "objective": "Identify character actions and chronological story sequence.",
                "q": "What did the otter hold?",
                "options": [{"text": "A shiny green shell", "emoji": "🐚"}, {"text": "A silver fish", "emoji": "🐟"}, {"text": "A round pebble", "emoji": "🪨"}],
                "ans": "A shiny green shell",
                "vocab": ["riverbank", "otter", "joyful", "backflip"],
            },
            3: {
                "title": "The Great Mountain Rescue",
                "passage": "High in the Rocky Peaks, Bruno the brave rescue dog searched through thick pine branches. He heard a soft whimper from a stray lost goat trapped on a rocky ledge. Bruno barked clear signals to his team until the goat was safely led down.",
                "objective": "Analyze story problem-and-solution structure and character motivations.",
                "q": "Where was the goat trapped?",
                "options": [{"text": "On a rocky ledge", "emoji": "🏔️"}, {"text": "In a deep cave", "emoji": "🕳️"}, {"text": "Near the river", "emoji": "🌊"}],
                "ans": "On a rocky ledge",
                "vocab": ["rescue", "whimper", "ledge", "signals"],
            },
            4: {
                "title": "The Guardian of Coral Reef",
                "passage": "Beneath turquoise tropical swells, a hawksbill sea turtle named Coral navigated complex reef corridors. When discarded fishing debris threatened the nursery lagoon, Coral alerted the elder pod, orchestrating a clever maneuver to free the young creatures.",
                "objective": "Interpret thematic meaning and character agency in extended literary fiction.",
                "q": "What threatened the nursery lagoon?",
                "options": [{"text": "Discarded fishing debris", "emoji": "🕸️"}, {"text": "A big storm", "emoji": "⛈️"}, {"text": "Cold water", "emoji": "🧊"}],
                "ans": "Discarded fishing debris",
                "vocab": ["turquoise", "corridors", "discarded", "maneuver"],
            },
        },
    },
    "word_activity": {
        "animals": {
            1: {
                "title": "Animal Word Explorer",
                "passage": "Explore these friendly animal words: cat, dog, pig, fox.",
                "objective": "Recognize and read foundational 3-letter CVC animal words.",
                "q": "Which word names a pet that barks?",
                "options": [{"text": "dog", "emoji": "🐶"}, {"text": "cat", "emoji": "🐱"}, {"text": "pig", "emoji": "🐷"}],
                "ans": "dog",
                "vocab": ["cat", "dog", "pig", "fox"],
            },
            2: {
                "title": "Wild Words Builder",
                "passage": "Assemble letter blocks to make words: frog, bird, duck, bear.",
                "objective": "Recognize and spell 4-letter words with blends.",
                "q": "Which animal has green skin and jumps?",
                "options": [{"text": "frog", "emoji": "🐸"}, {"text": "bear", "emoji": "🐻"}, {"text": "duck", "emoji": "🦆"}],
                "ans": "frog",
                "vocab": ["frog", "bird", "duck", "bear"],
            },
        }
    },
    "speaking": {
        "animals": {
            1: {
                "title": "Animal Sounds Speak & Shine",
                "passage": "Practice pronouncing clear animal vocabulary words aloud.",
                "objective": "Articulate clear consonant sounds in animal vocabulary.",
                "q": "Which word starts with the 's' sound?",
                "options": [{"text": "snake", "emoji": "🐍"}, {"text": "frog", "emoji": "🐸"}, {"text": "lion", "emoji": "🦁"}],
                "ans": "snake",
                "vocab": ["snake", "sheep", "seal", "swan"],
            },
            2: {
                "title": "Safari Speech Journey",
                "passage": "Speak vibrant safari words with steady rhythm and clear vowels.",
                "objective": "Maintain clear oral speech volume and phoneme articulation.",
                "q": "Which word has two syllables?",
                "options": [{"text": "tiger", "emoji": "🐅"}, {"text": "cat", "emoji": "🐱"}, {"text": "bat", "emoji": "🦇"}],
                "ans": "tiger",
                "vocab": ["tiger", "monkey", "cheetah", "zebra"],
            },
        }
    },
}


def assemble_content_item(req: ContentGenerationRequest) -> ContentItemModel:
    """Assembles an educational content item deterministically matching the requested skill and difficulty."""
    ctype = req.content_type if req.content_type in TEMPLATES else "reading"
    topic = req.topic if req.topic in TEMPLATES[ctype] else "animals"
    diff = req.difficulty if req.difficulty in TEMPLATES[ctype][topic] else 2

    tmpl = TEMPLATES[ctype][topic][diff]

    # Generate stable deterministic ID
    raw_hash = hashlib.md5(f"{ctype}-{topic}-{diff}-{req.skill}".encode()).hexdigest()[:8]
    item_id = f"gen-{ctype}-{topic}-d{diff}-{raw_hash}"

    # Target route
    if ctype == "reading":
        route = "/child/read"
        cat = "Reading"
    elif ctype == "story":
        route = f"/child/stories/{item_id}"
        cat = "Stories"
    elif ctype == "speaking":
        route = "/child/speak"
        cat = "Speaking"
    elif ctype == "sound":
        route = "/child/games/match-sound"
        cat = "Sounds"
    else:
        route = "/child/games/build-word"
        cat = "Games"

    icon = TOPIC_ICONS.get(topic, "✨")
    age_min = max(4, req.age - 1)
    age_max = min(10, req.age + 1)

    # Questions structure
    question_obj = None
    if "q" in tmpl:
        opts = [QuestionOption(text=o["text"], emoji=o.get("emoji")) for o in tmpl["options"]]
        question_obj = [
            ComprehensionQuestion(
                id=f"{item_id}-q1",
                q=tmpl["q"],
                options=opts,
                answer=tmpl["ans"],
            )
        ]

    item = ContentItemModel(
        id=item_id,
        title=tmpl["title"],
        description=f"Structured {ctype.replace('_', ' ')} practice focusing on {req.skill.replace('_', ' ')}.",
        content_type=ctype,
        category=cat,
        skill=req.skill,
        secondary_skills=["reading_fluency"] if req.skill != "reading_fluency" else ["comprehension"],
        difficulty=diff,
        difficulty_label=DIFFICULTY_LABELS_MAP.get(diff, "Easy"),
        age_range=f"{age_min}-{age_max}",
        age_min=age_min,
        age_max=age_max,
        estimated_minutes=4 + diff,
        prerequisites=[],
        tags=[topic, ctype, req.skill.replace("_", " "), "fresh quest", "assembled"],
        language=req.language,
        activity_type=ctype,
        learning_objective=tmpl["objective"],
        reinforcement_target=f"Target practice for {req.skill.replace('_', ' ')}",
        challenge_level="stretch" if diff >= 3 else ("supportive" if diff == 1 else "standard"),
        route=route,
        icon=icon,
        source_type=ContentSourceType.ASSEMBLED.value,
        passage=tmpl.get("passage"),
        expected_text=tmpl.get("passage"),
        questions=question_obj,
        vocabulary_words=tmpl.get("vocab"),
    )

    return item
