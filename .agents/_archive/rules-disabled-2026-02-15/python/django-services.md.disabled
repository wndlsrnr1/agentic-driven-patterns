---
description: Django Services — business orchestration, transactions, repository coordination
globs: "**/services/**/*.py", "**/**_service.py", "**/*_service.py", "**/*service.py"
alwaysApply: false
---

## Django Services (Project Standard)

### Core Principles

- **Business orchestration**: Services coordinate multiple repositories and handle complex workflows
- **Transaction boundaries**: Use `@transaction.atomic` for use-case level transactions
- **ORM access**: Services may directly use Django ORM when a repository abstraction does not exist or adds no value; maintain clear transaction boundaries and error mapping
- **Domain error mapping**: Raise `ServiceError`/`NotFoundServiceError` with HTTP status hints
- **Testability**: Clear dependency injection for easy mocking

### Service Architecture Pattern

```python
from django.db import transaction
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ExampleService:
    def __init__(self, example_repo, related_repo):
        self.example_repo = example_repo
        self.related_repo = related_repo
    
    @transaction.atomic
    def process_workflow(self, data: Dict[str, Any], user) -> Dict[str, Any]:
        """
        Pipeline: validate → load → process → persist → return
        """
        # 1) Validation
        validated_data = self._validate_request(data, user)
        
        # 2) Load entities via repositories
        entities = self._load_required_entities(validated_data)
        
        # 3) Business logic processing
        result = self._execute_business_logic(entities, validated_data)
        
        # 4) Persist changes via repositories
        saved_entities = self._persist_changes(result)
        
        # 5) Return domain objects, DTOs, or simple dictionaries depending on consumer needs
        return self._format_response(saved_entities)
```

### Pipeline Method Design

**Structure all service methods as clear pipelines:**

1. **Validation**: Check existence, basic business rules
2. **Loading**: Fetch required entities via repositories
3. **Processing**: Execute core business logic
4. **Persistence**: Save changes via repositories  
5. **Response**: Return domain objects, DTOs, or simple dictionaries depending on consumer needs

#### Pipeline with Repository Usage

```python
@transaction.atomic
def translate_episode(self, episode_id: int, language_code: str) -> Dict[str, Any]:
    # 1) Validation - Multiple repositories for existence checks
    episode, target_language = self._validate_translation_request(episode_id, language_code)
    
    # 2) Loading - Repository queries with optimizations
    bubbles = list(self.bubble_repo.find_by_episode_id(episode_id))
    if not bubbles:
        raise ServiceError("No bubbles found for translation", status_code=404)
    
    # 3) Processing - Business logic with loaded entities
    text_list_group = [[bubble.original_text or ""] for bubble in bubbles]
    translation_result = self.external_service.translate(text_list_group, ...)
    
    # 4) Persistence - Multiple repositories for atomic saves
    episode_locale, _ = self.episode_locale_repo.get_or_create_for_episode(episode, target_language)
    bubble_locales = [
        self.bubble_locale_repo.update_or_create_translation(bubble, episode_locale, ...)
        for bubble, translation in zip(bubbles, translation_result)
    ]
    
    # 5) Response - Domain objects
    return {"bubble_locales": bubble_locales, "episode_locale": episode_locale}

def _validate_translation_request(self, episode_id: int, language_code: str) -> Tuple[Episode, Language]:
    """Repository-based validation helper"""
    episode = self.episode_repo.get_by_id(episode_id)
    if not episode:
        raise NotFoundServiceError("Episode not found")
    
    target_language = self.language_repo.get_by_code(language_code)
    if not target_language:
        raise NotFoundServiceError("Target language not found")
    
    return episode, target_language
```

### Error Handling

```python
class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code

class NotFoundServiceError(ServiceError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

# Usage in services
def get_entity(self, entity_id: int):
    entity = self.repo.get_by_id(entity_id)
    if not entity:
        raise NotFoundServiceError(f"Entity {entity_id} not found")
    return entity
```

### Transaction Management

- **Use-case level**: One `@transaction.atomic` per service method
- **Nested calls**: Inner service calls should not have their own transactions
- **Rollback safety**: All repository operations within transaction will rollback on exception

```python
@transaction.atomic
def complex_workflow(self, data):
    # All repository operations are atomic
    entity1 = self.repo1.create(data['part1'])
    entity2 = self.repo2.update(entity1.id, data['part2'])
    # If any step fails, all changes rollback
    return {"entity1": entity1, "entity2": entity2}
```

### Repository Coordination

- **Single responsibility**: Each repository handles one model
- **Coordination in services**: Services orchestrate multiple repositories
- **No repository-to-repository calls**: All coordination through services
- **Direct repository injection**: Services directly instantiate and use repositories without helper layers

#### Direct Repository Usage Pattern

```python
class EpisodeTranslateService:
    def __init__(self):
        # Direct repository injection - no helper layers
        self.episode_repo = EpisodeRepository()
        self.bubble_repo = BubbleRepository()
        self.language_repo = LanguageRepository()
        self.episode_locale_repo = EpisodeLocaleRepository()
        self.bubble_locale_repo = BubbleLocaleRepository()
    
    @transaction.atomic
    def translate_episode(self, episode_id: int, language_code: str) -> Dict[str, Any]:
        # Use repositories directly for business orchestration
        episode = self.episode_repo.get_by_id(episode_id)
        target_language = self.language_repo.get_by_code(language_code)
        bubbles = list(self.bubble_repo.find_by_episode_id(episode_id))
        
        # Process business logic...
        
        # Coordinate multiple repositories for complex persistence
        episode_locale, _ = self.episode_locale_repo.get_or_create_for_episode(
            episode, target_language
        )
        
        bubble_locales = []
        for bubble, translated_text in zip(bubbles, translations):
            bubble_locale, _ = self.bubble_locale_repo.update_or_create_translation(
                bubble=bubble,
                episode_locale=episode_locale,
                target_language=target_language,
                translated_text=translated_text
            )
            bubble_locales.append(bubble_locale)
        
        return {"bubble_locales": bubble_locales, "episode_locale": episode_locale}
```

#### Multi-Repository Orchestration Benefits

- **Clear dependencies**: All required repositories visible in `__init__`
- **Atomic transactions**: Multiple repository operations under single transaction
- **Domain modeling**: Each repository represents a specific domain aggregate
- **Testability**: Easy to mock individual repositories for unit testing

### Input/Output Patterns

**Input**: Accept validated data from serializers, not raw request data
**Output**: Return domain objects, DTOs, or simple dictionaries; prefer DTOs when views or external integrations require stable contracts

```python
# Good: Accept validated data
def create_episode(self, validated_data: Dict[str, Any], user) -> Episode:
    pass

# Good: Return domain objects or simple dict
def translate_episode(self, episode_id: int, language_code: str) -> Dict[str, Any]:
    return {
        "bubble_locales": bubble_locales,  # List[BubbleLocale]
        "episode_locale": episode_locale   # EpisodeLocale
    }
```

### Logging Strategy

- **Info level**: Pipeline checkpoints, completion status
- **Error level**: Exception details with correlation IDs
- **No PII**: Never log sensitive user data or content

```python
def process_translation(self, episode_id: int, language_code: str):
    logger.info(f"Starting translation for episode {episode_id} to {language_code}")
    
    try:
        result = self._execute_translation(episode_id, language_code)
        logger.info(f"Translation completed for episode {episode_id}, {len(result)} bubbles")
        return result
    except Exception as e:
        logger.error(f"Translation failed for episode {episode_id}: {str(e)}")
        raise ServiceError("Translation processing failed", 500)
```

### Performance Considerations

- **Repository optimization**: Let repositories handle `select_related`/`prefetch_related`
- **Batch operations**: For bulk operations, use repository batch methods
- **Early optimization**: Avoid premature optimization; clarity first, performance second

```python
# Good: Repository handles optimization
bubbles = self.bubble_repo.find_by_episode_with_relations(episode_id)

# Good: Use batch methods for bulk operations  
self.bubble_locale_repo.bulk_update_translations(bubble_translations)
```

### Testing Guidelines

- **Mock repositories**: Service tests should mock repository dependencies
- **Test pipelines**: Verify each pipeline step and error conditions
- **Transaction testing**: Ensure rollback behavior on exceptions
- **Multi-repository mocking**: Mock all repositories used in service workflows

```python
class EpisodeTranslateServiceTest(TestCase):
    def setUp(self):
        # Mock all repositories used by the service
        self.mock_episode_repo = Mock()
        self.mock_bubble_repo = Mock()
        self.mock_language_repo = Mock()
        self.mock_episode_locale_repo = Mock()
        self.mock_bubble_locale_repo = Mock()
        
        # Inject mocks into service
        self.service = EpisodeTranslateService()
        self.service.episode_repo = self.mock_episode_repo
        self.service.bubble_repo = self.mock_bubble_repo
        self.service.language_repo = self.mock_language_repo
        self.service.episode_locale_repo = self.mock_episode_locale_repo
        self.service.bubble_locale_repo = self.mock_bubble_locale_repo
    
    def test_translate_episode_success(self):
        # Given - Mock repository returns
        episode_mock = Mock()
        language_mock = Mock()
        bubble_mock = Mock(original_text="Hello")
        
        self.mock_episode_repo.get_by_id.return_value = episode_mock
        self.mock_language_repo.get_by_code.return_value = language_mock
        self.mock_bubble_repo.find_by_episode_id.return_value = [bubble_mock]
        self.mock_episode_locale_repo.get_or_create_for_episode.return_value = (Mock(), True)
        self.mock_bubble_locale_repo.update_or_create_translation.return_value = (Mock(), True)
        
        # When
        result = self.service.translate_episode(1, "ko")
        
        # Then - Verify repository interaction sequence
        self.mock_episode_repo.get_by_id.assert_called_once_with(1)
        self.mock_language_repo.get_by_code.assert_called_once_with("ko")
        self.mock_bubble_repo.find_by_episode_id.assert_called_once_with(1)
        self.assertIsNotNone(result["bubble_locales"])
        self.assertIsNotNone(result["episode_locale"])
    
    def test_episode_not_found_raises_error(self):
        # Given
        self.mock_episode_repo.get_by_id.return_value = None
        
        # When/Then
        with self.assertRaises(NotFoundServiceError):
            self.service.translate_episode(999, "ko")
```

### 도메인 특화 서비스 패턴 (Kantar 프로젝트)

#### STT 변환 서비스

```python
class STTService:
    def __init__(self):
        self.audio_file_repo = AudioFileRepository()
        self.stt_data_repo = STTDataRepository()
        self.stt_client = STTClientFactory.create(settings.STT_PROVIDER)
    
    @transaction.atomic
    def convert_audio(self, audio_file_id: int, provider: str = None) -> Dict[str, Any]:
        """
        Pipeline: validate → load audio → call STT API → save result
        """
        # 1) Validation
        audio_file = self.audio_file_repo.get_by_id(audio_file_id)
        if not audio_file:
            raise NotFoundServiceError("Audio file not found")
        
        # 2) Load audio file
        audio_path = audio_file.file.path
        
        # 3) Call STT API (external service)
        try:
            stt_result = self.stt_client.transcribe(audio_path)
        except STTAPIError as e:
            logger.error(f"STT API error: {str(e)}")
            raise ServiceError("STT conversion failed", status_code=500)
        
        # 4) Save STT result
        stt_data = self.stt_data_repo.create({
            "audio_file": audio_file,
            "text": stt_result.text,
            "provider": provider or settings.STT_PROVIDER,
            "status": "completed"
        })
        
        return {"stt_data": stt_data, "text": stt_result.text}
```

#### AI 요약 서비스

```python
class SummaryService:
    def __init__(self):
        self.stt_data_repo = STTDataRepository()
        self.summary_repo = SummaryRepository()
        self.chatgpt_client = ChatGPTClient(api_key=settings.CHATGPT_API_KEY)
    
    @transaction.atomic
    def generate_summary(
        self, 
        stt_data_id: int, 
        user_prompt: str = None,
        admin_prompt: str = None
    ) -> Dict[str, Any]:
        """
        Pipeline: load STT → combine prompts → call ChatGPT → save summary
        """
        # 1) Load STT data
        stt_data = self.stt_data_repo.get_by_id(stt_data_id)
        if not stt_data:
            raise NotFoundServiceError("STT data not found")
        
        # 2) Combine prompts (user + admin)
        if admin_prompt is None:
            admin_prompt = self._get_admin_prompt()
        
        combined_prompt = self._combine_prompts(
            stt_data.text, 
            user_prompt, 
            admin_prompt
        )
        
        # 3) Call ChatGPT API
        try:
            summary_text = self.chatgpt_client.complete(combined_prompt)
        except ChatGPTAPIError as e:
            logger.error(f"ChatGPT API error: {str(e)}")
            raise ServiceError("Summary generation failed", status_code=500)
        
        # 4) Save summary
        summary = self.summary_repo.create({
            "stt_data": stt_data,
            "text": summary_text,
            "user_prompt": user_prompt,
            "admin_prompt": admin_prompt
        })
        
        return {"summary": summary, "text": summary_text}
    
    def _combine_prompts(self, text: str, user_prompt: str, admin_prompt: str) -> str:
        """사용자 프롬프트와 관리자 프롬프트 결합"""
        if admin_prompt:
            return f"{admin_prompt}\n\n{user_prompt if user_prompt else '위 텍스트를 요약해주세요.'}\n\n{text}"
        else:
            return f"{user_prompt if user_prompt else '위 텍스트를 요약해주세요.'}\n\n{text}"
```

#### 비동기 작업 트리거

```python
from celery import shared_task

class AudioService:
    def upload_and_convert_async(self, audio_file, user):
        """파일 업로드 후 비동기 STT 변환 트리거"""
        # 1) Save audio file
        audio = self.audio_file_repo.create({
            "file": audio_file,
            "user": user,
            "status": "pending"
        })
        
        # 2) Trigger async STT conversion
        convert_audio_async.delay(audio.id)
        
        return audio

@shared_task
def convert_audio_async(audio_file_id: int):
    """비동기 STT 변환 태스크"""
    stt_service = STTService()
    try:
        result = stt_service.convert_audio(audio_file_id)
        logger.info(f"STT conversion completed for audio {audio_file_id}")
    except Exception as e:
        logger.error(f"STT conversion failed: {str(e)}")
        # Update status to failed
        AudioFileRepository().update(
            AudioFileRepository().get_by_id(audio_file_id),
            status="failed"
        )
```

### Prohibited Patterns

- **Direct model access**: Never import or call models directly
- **Serializer coupling**: Don't call serializers from services
- **View logic**: No HTTP-specific logic in services
- **Nested transactions**: Don't use `@transaction.atomic` on helper methods
- **Repository business logic**: Keep repositories as data access only
- **Unnecessary helper layers**: Avoid creating helper classes when direct repository usage is clearer
- **Repository bypassing**: Don't use raw ORM queries when repository methods exist
- **Synchronous external API calls in views**: External API calls (STT, ChatGPT) must be async or in background tasks
- **Hardcoded API keys**: Never hardcode API keys; use settings/environment variables

#### Anti-Patterns to Avoid

```python
# BAD: Unnecessary helper layer
class EpisodeHelper:
    def __init__(self, episode_repo, bubble_repo):
        self.episode_repo = episode_repo
        self.bubble_repo = bubble_repo
    
    def get_episode_with_bubbles(self, episode_id):
        episode = self.episode_repo.get_by_id(episode_id)
        bubbles = self.bubble_repo.find_by_episode_id(episode_id)
        return episode, bubbles

class EpisodeService:
    def __init__(self):
        self.helper = EpisodeHelper(EpisodeRepository(), BubbleRepository())  # BAD
        
# GOOD: Direct repository usage
class EpisodeService:
    def __init__(self):
        self.episode_repo = EpisodeRepository()
        self.bubble_repo = BubbleRepository()
    
    def process_episode(self, episode_id):
        episode = self.episode_repo.get_by_id(episode_id)  # Direct and clear
        bubbles = self.bubble_repo.find_by_episode_id(episode_id)

# BAD: Repository bypassing
from comic.models import Episode
class EpisodeService:
    def get_episode(self, episode_id):
        return Episode.objects.get(id=episode_id)  # BAD: Bypasses repository

# GOOD: Repository usage
class EpisodeService:
    def __init__(self):
        self.episode_repo = EpisodeRepository()
    
    def get_episode(self, episode_id):
        episode = self.episode_repo.get_by_id(episode_id)  # GOOD: Uses repository
        if not episode:
            raise NotFoundServiceError("Episode not found")
        return episode
```