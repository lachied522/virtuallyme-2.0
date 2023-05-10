"""
unused functions that may be useful at some point
"""




def chatToCompletion(messages):
    """
    Converts a list of messages intended for chat model to a prompt.
    """
    stops = [" Me:", "AI:"]
    if messages[0]["role"]=="system":
        prompt = messages[0]["content"] + "\n\n"
    else:
        prompt = ""
    for message in [message for message in messages if message["role"]!="system"]:
        if message["role"]=="user":
            prompt += stops[0] + message["content"] + "\n"
        else:
            prompt += stops[1] + message["content"] + "\n"

    return prompt


def openai_call(prompts, max_tokens, temperature=0, presence_penalty=0):
    try:
        model='text-davinci-003'
        response = openai.Completion.create(
            model=model,
            prompt=prompts,
            max_tokens=max_tokens,
            temperature=temperature,
            presence_penalty=presence_penalty,
            stop=[" Me", " AI:"]
        )
    except:
        model='text-davinci-002'
        response = openai.Completion.create(
            model=model,
            prompt=prompts,
            max_tokens=temperature,
            temperature=temperature,
            presence_penalty=presence_penalty,
            stop=[" Me", " AI:"]
        )

    responses = []
    for choice in response.choices:
        responses.append(choice.text.strip())
    return responses
