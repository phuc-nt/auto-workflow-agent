# Jira API Reference

This document provides a comprehensive overview of the Jira API calls made during our previous interactions. It serves as a reference for making specific API requests in the future.

## API Calls

### 1. Create a Jira Project
- **Endpoint**: `/rest/api/2/project`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`
- **Request Body**:
  ```json
  {
    "key": "XDEMO2",
    "name": "Team X Demo 2",
    "projectTypeKey": "software",
    "leadAccountId": "<account-id>",
    "description": "Demo project created via API"
  }
  ```
  - **Parameters**:
    - `key`: A unique identifier for the project (e.g., "XDEMO2").
    - `name`: The name of the project.
    - `projectTypeKey`: The type of project. Common values include:
      - `"software"`: Software project.
      - `"business"`: Business project.
      - `"service_desk"`: Service Desk project.
    - `leadAccountId`: The account ID of the project lead.
    - `description`: A brief description of the project.
- **Example Usage**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/rest/api/2/project" -d '{
    "key": "XDEMO2",
    "name": "Team X Demo 2",
    "projectTypeKey": "software",
    "leadAccountId": "<account-id>",
    "description": "Demo project created via API"
  }'
  ```

### 2. Create a Jira Issue
- **Endpoint**: `/rest/api/2/issue`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`
- **Request Body**:
  ```json
  {
    "fields": {
      "project": {
        "key": "XDEMO2"
      },
      "summary": "[Web UI] Cung cấp giao diện chat để nhập lệnh",
      "description": "Phát triển giao diện chat cho phép người dùng nhập lệnh và yêu cầu. Tham chiếu: RF-UI-01",
      "issuetype": {
        "name": "Task"
      }
    }
  }
  ```
  - **Parameters**:
    - `fields`: Contains all the fields for the issue.
    - `project.key`: The key of the project to which the issue belongs.
    - `summary`: A brief summary of the issue.
    - `description`: A detailed description of the issue.
    - `issuetype.name`: The type of issue. Common values include:
      - `"Task"`: A standard task.
      - `"Bug"`: A bug report.
      - `"Story"`: A user story.
- **Example Usage**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/rest/api/2/issue" -d '{
    "fields": {
      "project": {
        "key": "XDEMO2"
      },
      "summary": "[Web UI] Cung cấp giao diện chat để nhập lệnh",
      "description": "Phát triển giao diện chat cho phép người dùng nhập lệnh và yêu cầu. Tham chiếu: RF-UI-01",
      "issuetype": {
        "name": "Task"
      }
    }
  }'
  ```

### 3. Transition a Jira Issue
- **Endpoint**: `/rest/api/2/issue/{issueIdOrKey}/transitions`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`
- **Request Body**:
  ```json
  {
    "transition": {
      "id": "<transition-id>"
    }
  }
  ```
  - **Parameters**:
    - `transition.id`: The ID of the transition to perform. Common values include:
      - `"11"`: Start Progress - Moves the issue to "In Progress" status.
      - `"21"`: Done - Moves the issue to "Done" status.
      - `"31"`: Stop Progress - Moves the issue back to "To Do" status.
- **Example Usage**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/rest/api/2/issue/XDEMO2-1/transitions" -d '{
    "transition": {
      "id": "11"
    }
  }'
  ```

### 4. Log Work on a Jira Issue
- **Endpoint**: `/rest/api/2/issue/{issueIdOrKey}/worklog`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Basic <base64-encoded-credentials>`
- **Request Body**:
  ```json
  {
    "timeSpent": "4h",
    "comment": "Hoàn thành task, thời gian thực tế là 4 giờ."
  }
  ```
  - **Parameters**:
    - `timeSpent`: The amount of time spent on the issue (e.g., "4h" for 4 hours).
    - `comment`: A comment describing the work done.
- **Example Usage**:
  ```bash
  curl -X POST -H "Content-Type: application/json" -u "<username>:<api-token>" "https://<your-domain>.atlassian.net/rest/api/2/issue/XDEMO2-1/worklog" -d '{
    "timeSpent": "4h",
    "comment": "Hoàn thành task, thời gian thực tế là 4 giờ."
  }'
  ```

## Conclusion

This document provides a detailed overview of the Jira API calls made during our interactions. Use this as a reference for making specific API requests in the future.
