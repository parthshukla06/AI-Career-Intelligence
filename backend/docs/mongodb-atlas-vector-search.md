# MongoDB Atlas Vector Search

The application stores local `all-MiniLM-L6-v2` embeddings as `Resume.candidateEmbedding` and `Job.embedding`. The vectors have 384 dimensions. Recommendations currently load active jobs in memory and fall back safely when embeddings are missing.

To enable Atlas vector retrieval later, create a Search index on the `jobs` collection with this definition:

```json
{
  "fields": [
    {
      "numDimensions": 384,
      "path": "embedding",
      "quantization": "scalar",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "isActive",
      "type": "filter"
    }
  ]
}
```

Use any Atlas Search index name, for example `job_embedding_vector_index`, and set the collection to `jobs`. This manual index is not required for the current fallback-compatible recommendation endpoint.