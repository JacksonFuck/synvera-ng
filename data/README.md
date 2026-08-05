# data/

Os dados do projeto. **Nenhum byte daqui entra no git** — só os ponteiros `.dvc`,
que têm ~120 bytes cada e apontam para o conteúdo no cache do DVC.

> ⚠️ São ~120GB. Um `git clean -xfd` apagaria tudo, porque para o git isto é
> "arquivo não rastreado". Não rode `git clean` neste repositório sem `-e data/`.

| Pasta | O que é | Versionado |
|---|---|---|
| `inbox/` | **você joga PDF e MD aqui** para serem indexados | não |
| `processed/` | markdown tratado — é o que alimenta o índice | **DVC** |
| `raw/` | PDFs originais e corpora baixados | não (ver abaixo) |
| `index/` | `rag_corpus.db` + LanceDB | **nunca** |
| `models/` | GGUFs do Gemma e do Meissa | nunca — vêm do HuggingFace |

## Por que cada um

**`processed/` sob DVC.** É a única coisa aqui que é ao mesmo tempo *cara de
reproduzir* e *fonte de verdade*. `pubmed-md` e `textbooks-md` são exatamente os
diretórios que o `documents.source_path` do banco aponta: 499.937 + 125.771 dos
629.070 documentos indexados. Reconstruí-los a partir dos PDFs exige rodar o parser
inteiro de novo.

`parsed_markdown/` fica de fora apesar de estar em `processed/`: são 632.954 arquivos
derivados do parser, regeneráveis a partir de `raw/`, e não são o que o índice
referencia.

**`index/` nunca.** É artefato derivado — reconstrói-se de `processed/` com
`scripts/build_ann_index.py` e `scripts/build_graph.py`. Versionar 34GB regeneráveis
seria pagar caro por nada.

**`raw/` ainda não.** São 80GB e o "remote" do DVC hoje aponta para
`~/synvera-dvc-store`, **no mesmo disco** — o que não é backup nem reprodutibilidade,
só duplicação. Só faz sentido rastrear `raw/` quando houver storage externo (S3,
disco removível, NAS). Até lá, os PDFs originais são a cópia única: trate-os como tal.

## Uso

```bash
dvc pull                       # traz processed/ do remote
dvc add data/processed/<novo>  # rastreia um conjunto novo
dvc push                       # envia ao remote
```

O cache usa **hardlink**: o DVC não duplica bytes no mesmo filesystem. Se você mover
este repositório para outro disco, rode `dvc checkout` para refazer os links.

## Reconstruir o índice do zero

```bash
cd services/rag-gateway
.venv/bin/python scripts/build_ann_index.py   # IVF_FLAT no LanceDB + ANALYZE no SQLite
.venv/bin/python scripts/build_graph.py       # tabelas graph_*
```

O `ANALYZE` não é opcional: sem `sqlite_stat1` o planner escolhe o plano ruim para o
JOIN de `_load_chunks` e a busca vai de 0,001s para 9,6s.
