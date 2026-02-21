---
description: Async Tasks — @Async methods, @Scheduled tasks, long-running job processing, status management
globs: "**/task/**/*.java", "**/*Task.java", "**/*Scheduler.java"
alwaysApply: false
---

## Async Tasks Guide

### Principles

1. **Long-running tasks must be async**: STT conversion, summarization, etc. must be processed as async tasks
2. **Status management**: Store task status in DB and update periodically
3. **Retry logic**: Automatically retry on network errors, etc.
4. **Error handling**: Clearly record and log status on failure

### Usage Scenarios

**Async processing required**:
- STT conversion (external API calls)
- AI summarization (ChatGPT API calls)
- Large file processing
- Email sending

**Synchronous processing acceptable**:
- Simple CRUD operations
- Tasks requiring fast response (< 1 second)

### @Async Pattern

```java
@Service
public class SttService {
    @Async
    public CompletableFuture<SttResult> convertAudioAsync(Long audioFileId) {
        // 1) Update status to "processing"
        updateStatus(audioFileId, ProcessingStatus.PROCESSING);
        
        // 2) Call Service Layer
        try {
            SttResult result = convertAudio(audioFileId);
            updateStatus(audioFileId, ProcessingStatus.COMPLETED);
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            updateStatus(audioFileId, ProcessingStatus.FAILED);
            throw new ServiceException("STT conversion failed", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
```

### @Scheduled Pattern

```java
@Component
public class ScheduledTasks {
    private final SummaryService summaryService;
    
    @Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
    public void generateDailySummaries() {
        // Process scheduled tasks
    }
}
```

### Status Management

**Status values**:
- `PENDING`: Waiting
- `PROCESSING`: Processing
- `COMPLETED`: Completed
- `FAILED`: Failed

### Prohibited Patterns

1. **Direct task call from Controller**: Trigger only through Service Layer
2. **Synchronous processing**: Never process long-running tasks synchronously
3. **Status ignorance**: Never ignore task status tracking
4. **No retry**: Never fail without retry logic on network errors
5. **Error ignorance**: Never fail without status update
