"""restore_vector_items_table

Revision ID: 8fcc12892840
Revises: cc7f1eba4008
Create Date: 2026-03-06 07:45:33.815001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8fcc12892840'
down_revision: Union[str, None] = 'cc7f1eba4008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # cc7f1eba4008 마이그레이션에서 vector_items 테이블이 잘못 삭제됨 - 복구
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.execute("""
        CREATE TABLE IF NOT EXISTS vector_items (
            id SERIAL PRIMARY KEY,
            collection_name VARCHAR(50) NOT NULL,
            external_id VARCHAR(255) NOT NULL,
            document VARCHAR NOT NULL,
            metadata_json JSON NOT NULL,
            embedding vector(3072) NOT NULL
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_vector_items_collection_name ON vector_items (collection_name);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_vector_items_external_id ON vector_items (external_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS vector_items;")
