# CueAI OpenRouter LLM Benchmark

Real-world **speed + response** benchmark. Every configured model receives the **exact same questions**. Streaming measures TTFT, total latency, generation speed, and accuracy.

**Never commit `.env` or paste your API key into source, logs, CSV, or Excel.**

## Prerequisites

- Windows 10/11
- Python 3.10+
- OpenRouter API key in `.env` (gitignored)

## Setup (Windows)

```powershell
cd llm-benchmark
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Ensure `.env` contains:

```
OPENROUTER_API_KEY=your_key_here
```

## Commands

Quick smoke test (1 question x 1 run per model):

```powershell
python main.py --quick
```

Full benchmark (all questions x N runs):

```powershell
python main.py --runs 5
```

10-run benchmark:

```powershell
python main.py --runs 10
```

CueAI real-time only:

```powershell
python main.py --cueai --runs 5
```

Single model:

```powershell
python main.py --model openai/gpt-4o-mini --runs 5
```

## Outputs

Under `results/` (committed so reports can be shared; `.env` stays private):

- `raw_results.csv` — one row per model/question/run
- `model_summary.csv` — per-model aggregates
- `question_summary.csv` — per-question x model aggregates
- `LLM_Benchmark_Report.xlsx` — Executive Summary, Model Summary, Question Comparison, Speed, Accuracy, CueAI Real-Time, Raw Results, Errors (+ charts)

## Notes

- Models are configured only in `config.py`
- Accuracy is evaluated separately from latency (SUCCESS ≠ correct)
- Timings use `time.perf_counter()` on real streamed responses
- Timeout / retries: `REQUEST_TIMEOUT_SEC`, `MAX_RETRIES` in `config.py`
