# assistant_stub.py
import sys
import json
import re


def parse_params(param_string: str) -> dict:
    """Парсит строку параметров вида --params="question:...context:..."""
    result = {}

    # Убираем --params= если есть
    if param_string.startswith('--params='):
        param_string = param_string[9:]

    # Убираем внешние кавычки если есть
    if param_string.startswith('"') and param_string.endswith('"'):
        param_string = param_string[1:-1]
    elif param_string.startswith("'") and param_string.endswith("'"):
        param_string = param_string[1:-1]

    # Ищем question: и context:
    question_match = re.search(r'question:(.*?)(?=context:|$)', param_string, re.DOTALL)
    context_match = re.search(r'context:(.*?)$', param_string, re.DOTALL)

    if question_match:
        result['question'] = question_match.group(1).strip()
    if context_match:
        result['context'] = context_match.group(1).strip()

    return result


def get_response(question: str, context: str) -> str:
    """
    Заглушка - отвечает на основе контекста.
    Позже здесь будет настоящая модель.
    """
    # Простейшая логика поиска ключевых слов в контексте
    question_lower = question.lower()

    # Ищем подсказки в контексте
    if "console.writeline" in context.lower() or "console.write" in context.lower():
        if "вывести" in question_lower or "output" in question_lower:
            return "Для вывода текста в консоль на C# используйте команду Console.WriteLine(\"ваш текст\");"

    if "c#" in context.lower():
        if "что такое" in question_lower:
            # Берем первое предложение из контекста
            first_sentence = context.split('.')[0] + '.'
            return f"C# - это {first_sentence}"

    # Если ничего не нашли - берем релевантный кусок из контекста
    lines = context.split('\n')
    for line in lines:
        if "Console.WriteLine" in line:
            return f"Согласно материалам курса: {line.strip()}"

    # Универсальный ответ-заглушка
    return f"На вопрос '{question}' отвечаю на основе предоставленного контекста: {context[:200]}..."


def main():
    if len(sys.argv) < 2:
        print("Ошибка: не переданы параметры")
        print("Пример запуска:")
        print('python assistant_stub.py --params="question:Как вывести текст?context:Console.WriteLine выводит текст"')
        sys.exit(1)

    # Получаем строку параметров
    param_string = ' '.join(sys.argv[1:])

    # Парсим question и context
    params = parse_params(param_string)

    if not params.get('question'):
        print("Ошибка: не найден параметр 'question'")
        sys.exit(1)

    question = params['question']
    context = params.get('context', '')

    # Получаем ответ
    response = get_response(question, context)

    # Выводим результат в формате JSON для удобного парсинга
    output = {
        "question": question,
        "answer": response,
        "context_used": bool(context)
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()