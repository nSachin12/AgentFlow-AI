from datetime import datetime


class EventManager:

    @staticmethod
    def add_event(
        job,
        agent,
        event,
        metadata=None
    ):
        if metadata is None:
            metadata = {}

        job.events.append(
            {
                "timestamp":
                datetime.utcnow().isoformat(),

                "agent":
                agent,

                "event":
                event,

                "metadata":
                metadata
            }
        )

        return job