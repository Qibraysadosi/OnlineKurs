from pydantic import BaseModel


class ProgressOut(BaseModel):
    progress_percent: int
    completed_lessons: int
    total_lessons: int


class CourseProgressOut(ProgressOut):
    completed_lesson_ids: list[int]
