"""Benchmark question bank — every model receives the exact same questions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

EvalType = Literal["conceptual", "coding", "factual", "sql"]


@dataclass(frozen=True)
class PromptCase:
    id: str
    category: str
    text: str
    expected_keywords: tuple[str, ...] = ()
    expected_answer: str = ""
    eval_type: EvalType = "conceptual"
    # Optional coding checks (substring / keyword style; not fake pass/fail)
    coding_checks: tuple[str, ...] = ()


def _q(
    n: int,
    category: str,
    text: str,
    *,
    keywords: tuple[str, ...] = (),
    expected: str = "",
    eval_type: EvalType = "conceptual",
    coding_checks: tuple[str, ...] = (),
) -> PromptCase:
    return PromptCase(
        id=f"Q{n:02d}",
        category=category,
        text=text,
        expected_keywords=keywords,
        expected_answer=expected,
        eval_type=eval_type,
        coding_checks=coding_checks,
    )


# ---------------------------------------------------------------------------
# Core set (>= 30) — same questions for every model
# ---------------------------------------------------------------------------

PROMPTS: list[PromptCase] = [
    _q(
        1,
        "REST_API",
        "What is a REST API? Explain in 3 short points.",
        keywords=("rest", "http", "resource", "api", "stateless"),
        expected="REST uses HTTP methods to operate on resources in a stateless way.",
        eval_type="conceptual",
    ),
    _q(
        2,
        "HTTP_HTTPS",
        "What is the difference between HTTP and HTTPS?",
        keywords=("http", "https", "ssl", "tls", "encrypt", "secure"),
        expected="HTTPS is HTTP over TLS/SSL encryption.",
        eval_type="factual",
    ),
    _q(
        3,
        "OOP",
        "Explain polymorphism in Python with a simple example.",
        keywords=("polymorphism", "override", "method", "class", "same", "different"),
        expected="Polymorphism: same interface, different implementations (e.g. method override).",
        eval_type="conceptual",
    ),
    _q(
        4,
        "PYTHON",
        "Write a Python function to check whether a number is prime.",
        keywords=("def", "prime", "return"),
        expected="A function that returns True if n is prime.",
        eval_type="coding",
        coding_checks=("def", "return", "%", "for"),
    ),
    _q(
        5,
        "ALGORITHMS",
        "What is the time complexity of binary search?",
        keywords=("o(log", "log n", "logarithmic"),
        expected="O(log n)",
        eval_type="factual",
    ),
    _q(
        6,
        "SQL",
        "Find the second-highest salary using SQL. Assume a table employees(salary).",
        keywords=("select", "salary", "max", "order", "limit", "dense_rank", "distinct"),
        expected="Use MAX/subquery, ORDER BY LIMIT, or DENSE_RANK to get second highest salary.",
        eval_type="sql",
        coding_checks=("select", "salary"),
    ),
    _q(
        7,
        "SQL",
        "What is normalization in a database?",
        keywords=("normal", "redundant", "dependency", "form", "anomaly"),
        expected="Normalization organizes tables to reduce redundancy and anomalies.",
        eval_type="conceptual",
    ),
    _q(
        8,
        "PYTHON",
        "What is the difference between a list and tuple in Python?",
        keywords=("list", "tuple", "mutable", "immutable"),
        expected="Lists are mutable; tuples are immutable.",
        eval_type="factual",
    ),
    _q(
        9,
        "PYTHON_DEBUGGING",
        "Find the bug in this Python code:\nfor i in range(5) print(i)",
        keywords=("colon", "syntax", ":", "missing"),
        expected="Missing colon after range(5): should be `for i in range(5): print(i)`",
        eval_type="coding",
        coding_checks=("colon", ":"),
    ),
    _q(
        10,
        "OOP",
        "Explain inheritance in object-oriented programming.",
        keywords=("inherit", "parent", "child", "base", "subclass", "reuse"),
        expected="Inheritance lets a class reuse/extend another class's behavior.",
        eval_type="conceptual",
    ),
    _q(
        11,
        "REST_API",
        "What is an API endpoint?",
        keywords=("endpoint", "url", "path", "resource", "api"),
        expected="An endpoint is a specific URL/path where an API resource/action is available.",
        eval_type="factual",
    ),
    _q(
        12,
        "HTTP_HTTPS",
        "What is the difference between GET and POST?",
        keywords=("get", "post", "retrieve", "create", "body", "idempotent", "safe"),
        expected="GET retrieves data; POST submits/creates data (often with a body).",
        eval_type="factual",
    ),
    _q(
        13,
        "CODING_GENERATION",
        "Reverse a string in Python without using reversed().",
        keywords=("def", "[", "::-1", "for", "return"),
        expected="Use slicing s[::-1] or a loop; do not use reversed().",
        eval_type="coding",
        coding_checks=("def", "return"),
    ),
    _q(
        14,
        "PYTHON",
        "What is a Python dictionary?",
        keywords=("dict", "key", "value", "hash", "mapping"),
        expected="A dict maps unique keys to values.",
        eval_type="factual",
    ),
    _q(
        15,
        "ALGORITHMS",
        "Explain recursion with a simple example.",
        keywords=("recursion", "base", "call", "itself", "factorial", "fibonacci"),
        expected="A function calling itself with a base case (e.g. factorial).",
        eval_type="conceptual",
    ),
    _q(
        16,
        "COMPUTER_SCIENCE",
        "What is the difference between TCP and UDP?",
        keywords=("tcp", "udp", "reliable", "connection", "packet", "fast"),
        expected="TCP is connection-oriented/reliable; UDP is connectionless/faster but unreliable.",
        eval_type="factual",
    ),
    _q(
        17,
        "SQL",
        "What is an SQL JOIN?",
        keywords=("join", "table", "row", "key", "combine", "relate"),
        expected="JOIN combines rows from tables based on related columns.",
        eval_type="conceptual",
    ),
    _q(
        18,
        "SQL",
        "Explain indexing in SQL.",
        keywords=("index", "lookup", "speed", "query", "b-tree", "search"),
        expected="Indexes speed up lookups/filters at some write/storage cost.",
        eval_type="conceptual",
    ),
    _q(
        19,
        "GENERAL_KNOWLEDGE",
        "What is machine learning?",
        keywords=("learn", "data", "model", "predict", "pattern"),
        expected="ML systems learn patterns from data to make predictions/decisions.",
        eval_type="conceptual",
    ),
    _q(
        20,
        "GENERAL_KNOWLEDGE",
        "What is an LLM?",
        keywords=("large", "language", "model", "text", "token", "neural"),
        expected="A Large Language Model predicts/generates text from training data.",
        eval_type="factual",
    ),
    _q(
        21,
        "GENERAL_KNOWLEDGE",
        "What is RAG?",
        keywords=("retrieval", "augment", "generation", "document", "context", "knowledge"),
        expected="Retrieval-Augmented Generation retrieves documents to ground LLM answers.",
        eval_type="factual",
    ),
    _q(
        22,
        "INSTRUCTION_FOLLOWING",
        "What is prompt engineering? Answer in exactly 2 short sentences.",
        keywords=("prompt", "instruction", "model", "design", "engineer"),
        expected="Designing prompts to steer model behavior effectively.",
        eval_type="conceptual",
    ),
    _q(
        23,
        "COMPUTER_SCIENCE",
        "Explain microservices in simple terms.",
        keywords=("microservice", "service", "independent", "deploy", "api"),
        expected="App split into small independently deployable services.",
        eval_type="conceptual",
    ),
    _q(
        24,
        "COMPUTER_SCIENCE",
        "What is Docker?",
        keywords=("container", "image", "docker", "package", "runtime"),
        expected="Docker packages apps into portable containers.",
        eval_type="factual",
    ),
    _q(
        25,
        "COMPUTER_SCIENCE",
        "What is Git?",
        keywords=("git", "version", "commit", "repository", "control"),
        expected="Git is a distributed version control system.",
        eval_type="factual",
    ),
    _q(
        26,
        "COMPUTER_SCIENCE",
        "What is the difference between Git merge and rebase?",
        keywords=("merge", "rebase", "history", "branch", "commit"),
        expected="Merge combines histories; rebase replays commits for a linear history.",
        eval_type="conceptual",
    ),
    _q(
        27,
        "PYTHON",
        "What is an exception in Python?",
        keywords=("exception", "error", "try", "except", "raise"),
        expected="An exception signals an error that can be caught with try/except.",
        eval_type="factual",
    ),
    _q(
        28,
        "CODING_GENERATION",
        "Write a Python function to find duplicate values in a list.",
        keywords=("def", "duplicate", "set", "count", "return"),
        expected="Return values that appear more than once.",
        eval_type="coding",
        coding_checks=("def", "return"),
    ),
    _q(
        29,
        "ALGORITHMS",
        "Explain Big-O notation.",
        keywords=("big-o", "complexity", "growth", "worst", "input", "o("),
        expected="Big-O describes asymptotic upper bound of time/space vs input size.",
        eval_type="conceptual",
    ),
    _q(
        30,
        "TECHNICAL_INTERVIEW",
        'An interviewer asks: "Tell me about a project you built using Python." '
        "Give a concise professional answer (4-6 sentences).",
        keywords=("python", "project", "built", "challenge", "result", "implement"),
        expected="A concise STAR-style project story mentioning Python.",
        eval_type="conceptual",
    ),
    _q(
        31,
        "MATHEMATICS",
        "What is 17 * 24? Reply with the number and one short line of work.",
        keywords=("408",),
        expected="408",
        eval_type="factual",
    ),
    _q(
        32,
        "LOGICAL_REASONING",
        "If all APIs are services, and all services need interfaces, do all APIs need interfaces? "
        "Answer yes/no and one reason.",
        keywords=("yes", "interface", "service"),
        expected="Yes — if APIs are services and services need interfaces, APIs need interfaces.",
        eval_type="conceptual",
    ),
    _q(
        33,
        "DATA_STRUCTURES",
        "What is a stack data structure? Give push/pop and one use case.",
        keywords=("stack", "push", "pop", "lifo"),
        expected="LIFO structure with push/pop; e.g. undo, call stack.",
        eval_type="conceptual",
    ),
    _q(
        34,
        "SUMMARIZATION",
        "Summarize in 3 bullets: CueAI streams interview audio, detects questions, "
        "and returns short AI answers with low TTFT.",
        keywords=("stream", "question", "answer", "ttft", "cueai", "audio"),
        expected="3 bullets covering streaming, question detection, fast answers.",
        eval_type="conceptual",
    ),
    _q(
        35,
        "SHORT_ANSWER",
        "In one sentence: what is time-to-first-token (TTFT)?",
        keywords=("first", "token", "time", "latency", "stream"),
        expected="TTFT is latency until the first streamed token arrives.",
        eval_type="factual",
    ),
    _q(
        36,
        "CUEAI_INTERVIEW",
        "In a live interview, the candidate is asked about FAISS. Give a 30-second spoken answer.",
        keywords=("faiss", "vector", "search", "embedding", "similarity"),
        expected="FAISS is a library for fast vector similarity search.",
        eval_type="conceptual",
    ),
]

# ---------------------------------------------------------------------------
# CueAI real-time short questions (live interview simulation)
# ---------------------------------------------------------------------------

CUEAI_REALTIME_PROMPTS: list[PromptCase] = [
    _q(
        101,
        "CUEAI_REALTIME",
        "What is polymorphism?",
        keywords=("polymorphism", "same", "different", "method", "form"),
        expected="Same interface, different behavior.",
    ),
    _q(
        102,
        "CUEAI_REALTIME",
        "What is REST API?",
        keywords=("rest", "api", "http", "resource"),
        expected="HTTP-based API style for resources.",
    ),
    _q(
        103,
        "CUEAI_REALTIME",
        "Explain inheritance.",
        keywords=("inherit", "parent", "child", "reuse"),
        expected="Child class reuses parent behavior.",
    ),
    _q(
        104,
        "CUEAI_REALTIME",
        "What is SQL normalization?",
        keywords=("normal", "redundant", "database", "table"),
        expected="Reduce redundancy via structured tables.",
    ),
    _q(
        105,
        "CUEAI_REALTIME",
        "What is Python?",
        keywords=("python", "language", "interpret", "program"),
        expected="High-level programming language.",
    ),
    _q(
        106,
        "CUEAI_REALTIME",
        "What is an API?",
        keywords=("api", "interface", "application", "communicate"),
        expected="Interface for software components to communicate.",
    ),
    _q(
        107,
        "CUEAI_REALTIME",
        "What is HTTP?",
        keywords=("http", "protocol", "web", "request", "response"),
        expected="Hypertext Transfer Protocol for web requests.",
    ),
    _q(
        108,
        "CUEAI_REALTIME",
        "What is a database index?",
        keywords=("index", "lookup", "speed", "query"),
        expected="Structure that speeds up lookups.",
    ),
    _q(
        109,
        "CUEAI_REALTIME",
        "What is recursion?",
        keywords=("recursion", "itself", "base", "call"),
        expected="Function calling itself with a base case.",
    ),
    _q(
        110,
        "CUEAI_REALTIME",
        "What is a binary search?",
        keywords=("binary", "search", "sorted", "log", "half"),
        expected="Search sorted data by repeatedly halving the range; O(log n).",
    ),
]


def select_prompts(*, cueai_only: bool = False, quick: bool = False) -> list[PromptCase]:
    if cueai_only:
        prompts = list(CUEAI_REALTIME_PROMPTS)
    else:
        # Full benchmark includes core + CueAI realtime set
        prompts = list(PROMPTS) + list(CUEAI_REALTIME_PROMPTS)
    if quick:
        return prompts[:1]
    return prompts
