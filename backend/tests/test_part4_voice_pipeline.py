import unittest
from app.routers.voice import (
    voice_pipeline_status,
    get_multilingual_phrases,
    evaluate_pronunciation,
    PronunciationEvalRequest,
)

class TestVoicePipeline(unittest.TestCase):
    def test_voice_status_honest_reporting(self):
        data = voice_pipeline_status()
        self.assertIn("pipeline_mode", data)
        self.assertIn(data["pipeline_mode"], ["backend_neural", "browser_native"])
        self.assertIn("supported_languages", data)
        self.assertIn("te", data["supported_languages"])
        self.assertIn("hi", data["supported_languages"])
        self.assertIn("en", data["supported_languages"])
        self.assertIn("honest_disclosure", data)
        self.assertIn("Web Speech", data["honest_disclosure"])

    def test_get_multilingual_phrases(self):
        # Telugu phrases
        data_te = get_multilingual_phrases("te")
        self.assertTrue(len(data_te["letters"]) > 0)
        self.assertTrue(any(l["char"] == "అ" for l in data_te["letters"]))
        self.assertTrue(any("బాగుంది" in p for p in data_te["praise"]))

        # Hindi phrases
        data_hi = get_multilingual_phrases("hi")
        self.assertTrue(len(data_hi["letters"]) > 0)
        self.assertTrue(any(l["char"] == "अ" for l in data_hi["letters"]))
        self.assertTrue(any("शाबाश" in p for p in data_hi["praise"]))

    def test_evaluate_pronunciation_exact_match(self):
        payload = PronunciationEvalRequest(
            target_text="అమ్మ",
            spoken_text="అమ్మ",
            language="te"
        )
        data = evaluate_pronunciation(payload)
        self.assertTrue(data.is_match)
        self.assertEqual(data.accuracy_score, 100.0)
        self.assertIn("బాగుంది", data.feedback)

    def test_evaluate_pronunciation_mismatch(self):
        payload = PronunciationEvalRequest(
            target_text="कमल",
            spoken_text="हाथी",
            language="hi"
        )
        data = evaluate_pronunciation(payload)
        self.assertFalse(data.is_match)
        self.assertLess(data.accuracy_score, 65.0)
        self.assertIn("प्रयास", data.feedback)

if __name__ == "__main__":
    unittest.main()
