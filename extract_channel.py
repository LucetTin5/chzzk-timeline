import sqlite3
import json
from pathlib import Path


def export_channel_table_to_json(db_path: str, output_path: str = "channels.json"):
    # DB 파일 확인
    db_file = Path(db_path)
    if not db_file.exists():
        raise FileNotFoundError(f"DB 파일을 찾을 수 없습니다: {db_path}")

    # SQLite 연결
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # 결과를 dict처럼 접근 가능하게 설정
    cursor = conn.cursor()

    # channel 테이블 읽기
    cursor.execute("SELECT * FROM channel;")
    rows = cursor.fetchall()

    # Row → dict 변환
    data = [dict(row) for row in rows]

    # JSON 저장
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ {len(data)}개의 레코드를 '{output_path}'에 저장했습니다.")

    conn.close()


if __name__ == "__main__":
    # 예: 같은 폴더에 있는 database.sqlite 사용
    export_channel_table_to_json("server/sqlite.db", "channels.json")
