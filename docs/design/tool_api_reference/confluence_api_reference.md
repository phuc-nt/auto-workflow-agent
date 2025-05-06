# Confluence API Reference

This document provides a comprehensive overview of the Confluence API calls made during our previous interactions. It serves as a reference for making specific API requests in the future.

## API Calls

### 1. Create a Confluence Page
- **Endpoint**: `/rest/api/content`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`
- **Request Body**:
  ```json
  {
    "type": "page",
    "title": "Daily Report - XDEMO2 Project - 23/03/2025",
    "space": {
      "key": "TX"
    },
    "body": {
      "storage": {
        "value": "<h1>Daily Report - XDEMO2 Project - 23/03/2025</h1><p>Content here...</p>",
        "representation": "storage"
      }
    }
  }
  ```
  - **Parameters**:
    - `type`: The type of content, e.g., "page".
    - `title`: The title of the page.
    - `space.key`: The key of the space where the page will be created.
    - `body.storage.value`: The HTML content of the page.
    - `body.storage.representation`: The format of the content, typically "storage".
- **Example Usage**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/wiki/rest/api/content" -d '{
    "type": "page",
    "title": "Daily Report - XDEMO2 Project - 23/03/2025",
    "space": {
      "key": "TX"
    },
    "body": {
      "storage": {
        "value": "<h1>Daily Report - XDEMO2 Project - 23/03/2025</h1><p>Content here...</p>",
        "representation": "storage"
      }
    }
  }'
  ```

### 2. Search for Pages using CQL
- **Endpoint**: `/rest/api/content/search`
- **Method**: GET
- **Headers**: 
  - `Authorization: Basic <base64-encoded-credentials>`
- **Query Parameters**:
  - `cql`: The Confluence Query Language (CQL) string to search for content.
  - `limit`: The maximum number of results to return.
- **Example Usage**:
  ```bash
  curl -G -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/wiki/rest/api/content/search" --data-urlencode "cql=space=TX AND title~\"Daily Report\"" --data-urlencode "limit=10"
  ```

### 3. Get Page Content by ID
- **Endpoint**: `/rest/api/content/{id}`
- **Method**: GET
- **Headers**: 
  - `Authorization: Basic <base64-encoded-credentials>`
- **Path Parameters**:
  - `id`: The ID of the page to retrieve.
- **Example Usage**:
  ```bash
  curl -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/wiki/rest/api/content/262390?expand=body.storage"
  ```

## Conclusion

This document provides a detailed overview of the Confluence API calls made during our interactions. Use this as a reference for making specific API requests in the future.
