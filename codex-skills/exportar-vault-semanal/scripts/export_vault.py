#!/usr/bin/env python3
"""Export an immutable full Markdown snapshot from a vault."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


EXCLUDED_DIRECTORIES = {
    ".git",
    ".obsidian",
    ".trash",
    "node_modules",
    "__pycache__",
}
SENSITIVE_WORDS = {
    "credential",
    "credentials",
    "password",
    "passwd",
    "secret",
    "secrets",
    "token",
    "tokens",
    "private-key",
    "private_key",
    ".env",
}


def is_excluded(path: Path, source: Path, destination: Path) -> str | None:
    relative = path.relative_to(source)
    if destination == path or destination in path.parents:
        return "destination"
    if any(part in EXCLUDED_DIRECTORIES or part.startswith(".") for part in relative.parts):
        return "hidden or generated directory"
    lowered = "/".join(relative.parts).lower()
    if any(word in lowered for word in SENSITIVE_WORDS):
        return "sensitive-looking path"
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path, help="Vault root")
    parser.add_argument(
        "--destination",
        required=True,
        type=Path,
        help="Archive root; each snapshot is stored in YYYY-MM-DD/",
    )
    parser.add_argument(
        "--since",
        type=date.fromisoformat,
        default=date.today() - timedelta(days=7),
        help="Mark files modified on or after YYYY-MM-DD as changed",
    )
    parser.add_argument(
        "--snapshot-date",
        type=date.fromisoformat,
        default=date.today(),
        help="Snapshot folder date (default: today)",
    )
    return parser.parse_args()


def write_history(destination: Path) -> None:
    snapshots = []
    for folder in sorted(destination.iterdir()):
        if not folder.is_dir() or folder.name == "latest":
            continue
        try:
            snapshot_date = date.fromisoformat(folder.name)
        except ValueError:
            continue
        manifest_path = folder / "manifest.json"
        if not manifest_path.is_file():
            continue
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        snapshots.append((snapshot_date, manifest))

    lines = [
        "# Historial del vault",
        "",
        "Cada entrada apunta a una fotografía completa del vault en esa semana.",
        "",
        "| Snapshot | Documentos | Cambios desde el corte |",
        "| --- | ---: | ---: |",
    ]
    for snapshot_date, manifest in sorted(snapshots, reverse=True):
        lines.append(
            f"| [{snapshot_date.isoformat()}](<{snapshot_date.isoformat()}/INDEX.md>) | "
            f"{manifest['document_count']} | {len(manifest['changed_documents'])} |"
        )
    if not snapshots:
        lines.append("| — | 0 | 0 |")
    (destination / "HISTORY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    source = args.source.expanduser().resolve()
    destination = args.destination.expanduser().resolve()
    snapshot = destination / args.snapshot_date.isoformat()
    if not source.is_dir():
        raise SystemExit(f"Source vault does not exist or is not a directory: {source}")
    if source == destination or source in destination.parents:
        raise SystemExit("Destination must not be inside the source vault")
    if snapshot.exists():
        raise SystemExit(
            f"Snapshot already exists: {snapshot}. Use another --snapshot-date to keep snapshots immutable."
        )

    exported: list[str] = []
    changed: list[str] = []
    excluded: list[dict[str, str]] = []
    destination.mkdir(parents=True, exist_ok=True)
    snapshot.mkdir(parents=True)

    for path in sorted(source.rglob("*.md")):
        reason = is_excluded(path, source, destination)
        relative = path.relative_to(source)
        if reason:
            excluded.append({"path": relative.as_posix(), "reason": reason})
            continue
        modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).date()
        target = snapshot / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        exported.append(relative.as_posix())
        if modified >= args.since:
            changed.append(relative.as_posix())

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    manifest = {
        "source": str(source),
        "snapshot_date": args.snapshot_date.isoformat(),
        "since": args.since.isoformat(),
        "generated_at": generated_at,
        "document_count": len(exported),
        "changed_documents": changed,
        "documents": exported,
        "excluded": excluded,
    }
    (snapshot / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    index_lines = [
        f"# Contexto semanal — {args.snapshot_date.isoformat()}",
        "",
        f"- Corte de cambios desde: {args.since.isoformat()}",
        f"- Generado: {generated_at}",
        f"- Documentos en esta fotografía: {len(exported)}",
        f"- Documentos modificados desde el corte: {len(changed)}",
        "",
        "## Documentos modificados",
        "",
    ]
    index_lines.extend(f"- [{item}](<{item}>)" for item in changed)
    if not changed:
        index_lines.append("- No hubo documentos modificados desde el corte.")
    index_lines.extend(["", "## Vault completo", ""])
    index_lines.extend(f"- [{item}](<{item}>)" for item in exported)
    (snapshot / "INDEX.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    write_history(destination)

    print(f"Created snapshot {args.snapshot_date.isoformat()} with {len(exported)} documents")
    print(f"Changed since {args.since.isoformat()}: {len(changed)}")
    print(f"Excluded {len(excluded)} files or paths")


if __name__ == "__main__":
    main()
