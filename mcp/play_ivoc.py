#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
iVoc Autonomous MCP Player
Simulates an AI Agent playing the iVoc Leitner vocabulary quiz through the local MCP server over stdio.
"""

import sys
import os
import json
import subprocess
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

SERVER_SCRIPT = Path(__file__).resolve().parent / "server.py"

class MCPClient:
    def __init__(self, script_path: Path):
        self.proc = subprocess.Popen(
            [sys.executable, str(script_path)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8"
        )
        self.request_id = 0

    def call_method(self, method: str, params: dict = None):
        self.request_id += 1
        req = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params or {}
        }
        self.proc.stdin.write(json.dumps(req, ensure_ascii=False) + "\n")
        self.proc.stdin.flush()
        line = self.proc.stdout.readline()
        if not line:
            stderr_out = self.proc.stderr.read()
            raise RuntimeError(f"Server closed connection. Stderr: {stderr_out}")
        return json.loads(line)

    def call_tool(self, tool_name: str, arguments: dict = None):
        resp = self.call_method("tools/call", {
            "name": tool_name,
            "arguments": arguments or {}
        })
        if "error" in resp:
            raise RuntimeError(f"MCP RPC Error: {resp['error']}")
        result = resp.get("result", {})
        content = result.get("content", [])
        if content and content[0].get("type") == "text":
            return json.loads(content[0]["text"])
        return result

    def close(self):
        try:
            self.proc.terminate()
            self.proc.wait(timeout=2)
        except Exception:
            self.proc.kill()


def play_session(num_rounds: int = 15):
    print("=" * 70)
    print("  🚀 Starting Autonomous iVoc Session via Local MCP Server")
    print("=" * 70)

    client = MCPClient(SERVER_SCRIPT)

    # 1. Initialize MCP Connection
    init_res = client.call_method("initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "AutonomousAgentPlayer", "version": "1.0.0"}
    })
    server_info = init_res["result"]["serverInfo"]
    print(f" Connected to MCP Server: {server_info['name']} v{server_info['version']}")

    # 2. Discover Tools
    tools_res = client.call_method("tools/list")
    tools = [t["name"] for t in tools_res["result"]["tools"]]
    print(f" Discovered {len(tools)} MCP Tools: {', '.join(tools)}\n")

    # 3. Reset progress for clean autonomous demonstration
    print("🧹 Resetting session progress...")
    reset_res = client.call_tool("ivoc_reset_progress", {"letter": "ALL"})
    print(f" {reset_res.get('message')}\n")

    # Quick lookup demo
    print("🔍 Looking up word 'Abundance' via ivoc_lookup_word:")
    lookup = client.call_tool("ivoc_lookup_word", {"query": "abundance", "limit": 2})
    for item in lookup:
        print(f"   • {item['word']} -> {item['translation']} (Letter: {item['letter']}, Box: {item['box']})")
    print()

    # Dictionary lookup helper for the player agent
    # The agent will look up the correct translation for autonomous play
    with open(SERVER_SCRIPT.parent.parent / "public" / "data" / "vocabulary.json", "r", encoding="utf-8") as f:
        vocab = {w["id"]: w for w in json.load(f)}

    print("-" * 70)
    print(f"🎮 Beginning Leitner Spaced Repetition Play ({num_rounds} Questions)")
    print("-" * 70)

    for i in range(1, num_rounds + 1):
        # Fetch next question according to Leitner rules
        q = client.call_tool("ivoc_get_next_question", {"letter": "ALL"})
        if q.get("allMastered"):
            print("🎉 All words mastered!")
            break

        word_id = q["wordId"]
        word_info = vocab.get(word_id, {})
        prompt = q["prompt"]
        current_box = q["currentBox"]
        letter = q["letter"]
        options = q["options"]
        correct_translation = word_info.get("translation", "")

        print(f"\n[Round {i:02d} | Session Counter #{q['sessionCounter']}]")
        print(f"  📖 Question: What is the meaning of '{prompt}'? (Letter: {letter}, Current Box: {current_box})")
        print(f"  📋 Options: {', '.join(f'({idx+1}) {opt}' for idx, opt in enumerate(options))}")

        # On round 4, simulate an intentional wrong answer to demonstrate Leitner demotion to Box 0
        if i == 4:
            # Pick a distractor (wrong option)
            wrong_options = [opt for opt in options if opt != correct_translation]
            chosen_answer = wrong_options[0] if wrong_options else options[0]
            print(f"  🤖 Agent Action: [Simulating mistake] Selected '{chosen_answer}'")
        else:
            # Agent selects the correct answer
            chosen_answer = correct_translation if correct_translation in options else options[0]
            print(f"  🤖 Agent Action: Selected '{chosen_answer}'")

        # Submit answer via MCP
        sub_res = client.call_tool("ivoc_submit_answer", {
            "wordId": word_id,
            "selectedAnswer": chosen_answer
        })

        is_correct = sub_res.get("correct")
        status_icon = "✅" if is_correct else "❌"
        prev_b = sub_res.get("previousBox")
        new_b = sub_res.get("newBox")
        due_counter = sub_res.get("nextDueCounter")

        print(f"  {status_icon} Result: {sub_res.get('feedback')}")
        print(f"     Box transition: Box {prev_b} ➜ Box {new_b} | Next due at counter: #{due_counter}")
        time.sleep(0.05)

    print("\n" + "=" * 70)
    print("📊 Final Statistics from ivoc_get_stats:")
    print("=" * 70)
    stats = client.call_tool("ivoc_get_stats")
    print(f" Total Words in Dictionary: {stats['totalWords']}")
    print(f" Studied Words:             {stats['studiedWords']}")
    print(f" Total Attempts:            {stats['totalAttempts']}")
    print(f" Correct Answers:           {stats['correctAnswers']}")
    print(f" Errors / Retries:          {stats['errorCount']}")
    print(f" Accuracy Rate:             {stats['accuracy']}")
    print(f" Box Distribution:")
    for box_name, count in stats["boxDistribution"].items():
        bar = "█" * min(50, count)
        print(f"   • {box_name.ljust(28)}: {str(count).rjust(4)} {bar}")

    client.close()
    print("\n✅ Autonomous MCP test session completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    play_session(rounds)
