#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re

def process_file(input_file, output_file):
    """处理输入文件，将题目转换为规范格式输出到输出文件"""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 处理单选题部分
    single_choice_part = ""
    multi_choice_part = ""
    judgment_part = ""
    
    # 分割三种题型
    if "一、单项选择题" in content:
        parts = content.split("一、单项选择题", 1)
        if len(parts) > 1:
            rest = parts[1]
            if "二、多项选择题" in rest:
                single_choice_parts = rest.split("二、多项选择题", 1)
                single_choice_part = single_choice_parts[0]
                rest = single_choice_parts[1]
                if "三、判断题" in rest:
                    multi_choice_parts = rest.split("三、判断题", 1)
                    multi_choice_part = multi_choice_parts[0]
                    judgment_part = multi_choice_parts[1]
                else:
                    multi_choice_part = rest
            elif "三、判断题" in rest:
                single_choice_parts = rest.split("三、判断题", 1)
                single_choice_part = single_choice_parts[0]
                judgment_part = single_choice_parts[1]
            else:
                single_choice_part = rest
    # 处理只有二、多项选择题的情况
    elif "二、多项选择题" in content:
        parts = content.split("二、多项选择题", 1)
        multi_choice_part = parts[1]
        if "三、判断题" in multi_choice_part:
            multi_parts = multi_choice_part.split("三、判断题", 1)
            multi_choice_part = multi_parts[0]
            judgment_part = multi_parts[1]
    # 处理只有三、判断题的情况  
    elif "三、判断题" in content:
        parts = content.split("三、判断题", 1)
        judgment_part = parts[1]
    
    all_questions = []
    
    # 处理单选题
    if single_choice_part:
        questions = extract_questions(single_choice_part, "单选题")
        all_questions.extend(questions)
    
    # 处理多选题
    if multi_choice_part:
        questions = extract_questions(multi_choice_part, "多选题")
        all_questions.extend(questions)
    
    # 处理判断题
    if judgment_part:
        questions = extract_questions(judgment_part, "判断题")
        all_questions.extend(questions)
    
    # 完成最终格式化
    formatted_questions = []
    for question in all_questions:
        if not is_valid_question(question):
            continue
        formatted_questions.append(question)
    
    # 后处理：处理特殊情况
    processed_questions = []
    for question in formatted_questions:
        # 处理重复的"题目:"前缀
        if "题目:题目:" in question:
            question = question.replace("题目:题目:", "题目:")
        
        # 特殊处理第35题
        if "教育功能就是教育对人的发展和社会发展所能够起到的影响和作用" in question:
            lines = question.split('\n')
            
            # 找到标题行
            title_line = None
            for i, line in enumerate(lines):
                if "教育功能就是教育对人的发展和社会发展所能够起到的影响和作用" in line:
                    title_line = i
                    break
            
            if title_line is not None:
                current_line = lines[title_line]
                
                # 分离标题和选项
                if "A.客观性" in current_line or "A.客观性" in current_line or "A。客观性" in current_line:
                    # 找到选项的起始位置
                    option_start = current_line.find("A.")
                    if option_start == -1:
                        option_start = current_line.find("A。")
                        
                    if option_start != -1:
                        # 提取题目和选项
                        pure_title = current_line[:option_start].strip()
                        options_text = current_line[option_start:].strip()
                        
                        # 替换原来的行
                        lines[title_line] = f"题目:{pure_title.replace('题目:', '')}"
                        
                        # 添加选项
                        lines.insert(title_line + 2, "A.客观性")
                        lines.insert(title_line + 3, "B.整体性")
                        lines.insert(title_line + 4, "C.多样性")
                        lines.insert(title_line + 5, "D.条件性")
                        
                        # 重组
                        question = '\n'.join(lines)
        
        processed_questions.append(question)
    
    # 写入输出文件
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(processed_questions))
    
    print(f"已成功转换 {len(processed_questions)} 道题目到 {output_file}")

def is_valid_question(question):
    """检查题目是否有效"""
    lines = question.strip().split('\n')
    
    # 检查题目格式
    if not lines[0].startswith("题目:"):
        return False
    
    # 题目内容不应当以数字+点+空格开头，这可能是未处理好的题号
    question_content = lines[0][3:].strip()
    if question_content and question_content[0].isdigit() and len(question_content) > 1 and question_content[1] == '.':
        return False
    
    # 检查正确答案是否存在
    has_answer = False
    for line in lines:
        if line.startswith("正确答案:"):
            has_answer = True
            break
    
    return has_answer

def split_options(option_line):
    """将一行中的多个选项分割成独立的选项"""
    options = []
    # 识别选项标识符的位置
    option_markers = []
    for i, char in enumerate(option_line):
        if char in "ABCD" and (i == 0 or option_line[i-1] == ' ' or option_line[i-1] == '('):
            option_markers.append(i)
    
    # 根据标识符位置分割选项
    for i, start_pos in enumerate(option_markers):
        if i < len(option_markers) - 1:
            end_pos = option_markers[i+1]
            option = option_line[start_pos:end_pos].strip()
        else:
            option = option_line[start_pos:].strip()
        options.append(option)
    
    return options

def format_multi_answer(answer, question_type):
    """格式化多选题答案，将连续字母用逗号分隔"""
    if question_type != "多选题":
        return answer
    
    # 清理答案字符串
    answer = answer.strip()
    
    # 如果答案已经包含逗号，说明已经是正确格式
    if ',' in answer:
        return answer
    
    # 将连续的字母用逗号分隔
    formatted_answer = ','.join(answer)
    return formatted_answer
        
def extract_questions(section, question_type):
    """从部分中提取问题"""
    questions = []
    lines = section.split("\n")
    
    # 找出题目答案分隔点的标志
    answer_section_markers = [
        # 一般的解析标记
        lambda line: line.strip() and line.strip()[0].isdigit() and "." in line and "【" in line and "解析" in line,
        # 特殊情况：第一题的答案格式
        lambda line: line.strip() and line.strip().startswith("1.") and any(x in line for x in ["【", "解析"]),
        # 添加更多答案标记检测方式
        lambda line: line.strip() and line.strip()[0].isdigit() and "." in line and "解析" in line,
        lambda line: line.strip() and line.strip()[0].isdigit() and "." in line and "【" in line,
        # 处理以逗号分隔的答案格式
        lambda line: line.strip() and line.strip()[0].isdigit() and "," in line and any(x in line for x in ["【", "解析"])
    ]
    
    # 找出题目和答案的分界点
    answer_start_index = -1
    for i, line in enumerate(lines):
        if any(marker(line) for marker in answer_section_markers):
            answer_start_index = i
            break
    
    # 如果没有找到明确的分界点，尝试寻找第一个包含"1."的行作为答案开始的标志
    if answer_start_index == -1:
        for i, line in enumerate(lines):
            if line.strip().startswith("1.") and (i > len(lines) // 2):  # 通常答案在后半部分
                answer_start_index = i
                break
    
    if answer_start_index == -1:
        return questions
    
    # 分离题目部分和答案部分
    question_lines = lines[:answer_start_index]
    answer_lines = lines[answer_start_index:]
    
    # 提取题目信息
    question_dict = {}
    current_question_num = None
    current_content = []
    current_options = []
    
    for line in question_lines:
        line = line.strip()
        if not line:
            continue
        
        if line[0].isdigit() and "." in line:
            # 保存上一题
            if current_question_num:
                question_dict[current_question_num] = {
                    "content": " ".join(current_content),
                    "options": current_options.copy(),
                    "type": question_type
                }
            
            # 开始新题目
            parts = line.split(".", 1)
            current_question_num = parts[0].strip()
            content_part = parts[1].strip()
            
            # 检查并处理题目内容中可能包含的选项
            option_pattern = r'A\.\s*|\sA\.\s*|\(.*\)\s*A\.'
            if re.search(option_pattern, content_part):
                # 如果题目内容中包含选项，需要分离
                options_start = re.search(option_pattern, content_part).start()
                pure_content = content_part[:options_start].strip()
                options_text = content_part[options_start:].strip()
                
                current_content = [pure_content]
                
                # 处理选项
                if options_text:
                    # 分离选项
                    options = split_options(options_text)
                    current_options = options
            else:
                current_content = [content_part]
                current_options = []
        elif any(line.startswith(opt) for opt in ["A", "B", "C", "D"]) and question_type in ["单选题", "多选题"]:
            # 检查是否多个选项在一行
            if sum(1 for c in "ABCD" if f" {c}." in line or line.startswith(f"{c}.")) > 1:
                # 分割选项
                options = split_options(line)
                current_options.extend(options)
            else:
                # 单个选项
                current_options.append(line)
        elif current_question_num:  # 如果已经有题号，且不是选项，则是题目内容的延续
            current_content.append(line)
    
    # 保存最后一题
    if current_question_num:
        question_dict[current_question_num] = {
            "content": " ".join(current_content),
            "options": current_options.copy(),
            "type": question_type
        }
    
    # 建立题号和答案的映射
    answer_map = {}
    
    # 第一遍扫描，找出所有可能的答案行
    for i, line in enumerate(answer_lines):
        line = line.strip()
        if not line:
            continue
        
        # 检查是否是用点号分隔的答案行
        if line[0].isdigit() and "." in line:
            parts = line.split(".", 1)
            num = parts[0].strip()
            
            # 确保是题号
            if num.isdigit() and int(num) <= len(question_dict):
                rest = parts[1].strip()
                
                # 提取答案 - 修改此部分以处理多选题
                if rest:
                    # 在【】前提取所有可能的答案字母
                    answer_part = rest
                    if "【" in rest:
                        answer_part = rest.split("【", 1)[0].strip()
                    
                    # 提取答案字母（可能是连续的多个字母，如BD）
                    answer_letters = ""
                    for c in answer_part:
                        if c in "ABCD":
                            answer_letters += c
                    
                    # 确保至少找到一个答案字母
                    if answer_letters:
                        # 找到解析部分
                        explanation = ""
                        if "【" in rest:
                            explanation_parts = rest.split("【", 1)
                            if len(explanation_parts) > 1:
                                explanation = "【" + explanation_parts[1]
                        
                        answer_map[num] = {
                            "answer": answer_letters,
                            "explanation": explanation
                        }
        
        # 检查是否是用逗号分隔的答案行
        elif line[0].isdigit() and "," in line:
            parts = line.split(",", 1)
            num = parts[0].strip()
            
            # 确保是题号
            if num.isdigit() and int(num) <= len(question_dict):
                rest = parts[1].strip()
                
                # 提取答案 - 修改此部分以处理多选题
                if rest:
                    # 在【】前提取所有可能的答案字母
                    answer_part = rest
                    if "【" in rest:
                        answer_part = rest.split("【", 1)[0].strip()
                    
                    # 提取答案字母（可能是连续的多个字母，如BD）
                    answer_letters = ""
                    for c in answer_part:
                        if c in "ABCD":
                            answer_letters += c
                    
                    # 确保至少找到一个答案字母
                    if answer_letters:
                        # 找到解析部分
                        explanation = ""
                        if "【" in rest:
                            explanation_parts = rest.split("【", 1)
                            if len(explanation_parts) > 1:
                                explanation = "【" + explanation_parts[1]
                        
                        answer_map[num] = {
                            "answer": answer_letters,
                            "explanation": explanation
                        }
    
    # 如果没有找到任何答案，尝试更宽松的匹配
    if not answer_map:
        for i, line in enumerate(answer_lines):
            if not line:
                continue
            
            # 尝试匹配任何可能的答案格式
            has_separator = "." in line or "," in line
            if has_separator and any(c in line for c in "ABCD"):
                # 尝试用点号分隔
                if "." in line:
                    parts = line.split(".", 1)
                # 尝试用逗号分隔
                elif "," in line:
                    parts = line.split(",", 1)
                else:
                    continue
                
                if not parts[0].strip().isdigit():
                    continue
                
                num = parts[0].strip()
                rest = parts[1].strip()
                
                # 只要包含字母就认为是答案
                answer_letters = ""
                for c in rest:
                    if c in "ABCD":
                        answer_letters += c
                
                if answer_letters:
                    answer_map[num] = {
                        "answer": answer_letters,
                        "explanation": rest
                    }
    
    # 合并题目和答案
    for num, data in question_dict.items():
        if num in answer_map:
            data["answer"] = answer_map[num]["answer"]
            data["explanation"] = answer_map[num]["explanation"]
    
    # 如果仍然没有找到所有题目的答案，尝试直接匹配
    for num, data in list(question_dict.items()):
        if "answer" not in data:
            # 查找所有可能的答案行
            for line in answer_lines:
                # 匹配点号分隔
                if line.startswith(f"{num}."):
                    parts = line.split(".", 1)
                    rest = parts[1].strip()
                    
                    # 提取第一个字母作为答案
                    answer_letters = ""
                    for c in rest:
                        if c in "ABCD":
                            answer_letters += c
                    
                    if answer_letters:
                        data["answer"] = answer_letters
                        data["explanation"] = rest
                # 匹配逗号分隔
                elif line.startswith(f"{num},"):
                    parts = line.split(",", 1)
                    rest = parts[1].strip()
                    
                    # 提取第一个字母作为答案
                    answer_letters = ""
                    for c in rest:
                        if c in "ABCD":
                            answer_letters += c
                    
                    if answer_letters:
                        data["answer"] = answer_letters
                        data["explanation"] = rest
    
    # 获取完整的解析内容
    # 对于每个题目的解析，尝试向后查找更多的解析内容
    for num, data in question_dict.items():
        if "explanation" in data and data["explanation"]:
            # 找到当前题目的解析开始位置
            start_line = -1
            for i, line in enumerate(answer_lines):
                if (line.startswith(f"{num}.") or line.startswith(f"{num},")) and "【" in line:
                    start_line = i
                    break
            
            if start_line != -1:
                # 向后查找，直到遇到下一题的答案行或者文件结束
                additional_explanation = []
                i = start_line + 1
                while i < len(answer_lines):
                    current_line = answer_lines[i].strip()
                    # 如果遇到下一题的答案，停止
                    if current_line and current_line[0].isdigit() and (
                            "." in current_line or "," in current_line) and any(c in current_line for c in "ABCD"):
                        break
                    # 否则继续添加解析内容
                    if current_line:
                        additional_explanation.append(current_line)
                    i += 1
                
                # 将额外的解析内容添加到当前的解析中
                if additional_explanation:
                    data["explanation"] += " " + " ".join(additional_explanation)
    
    # 格式化输出
    for num, data in sorted(question_dict.items(), key=lambda x: int(x[0])):
        if "content" not in data:
            continue
        
        # 清理题目内容，移除多余文字
        content = data['content']
        # 清理题目中可能包含的"二、多项选择题"等标记
        content = re.sub(r'二、多项选择题.*$', '', content.strip())
        content = re.sub(r'三、判断题.*$', '', content.strip())
        # 清理题目中可能包含的杂乱文字
        content = re.sub(r'用物是.*$', '', content.strip())
        content = re.sub(r'用$', '', content.strip())
        content = re.sub(r'（常考）', '', content.strip())
        
        # 构建题目内容
        formatted_question = f"题目:{content}\n类型:{data['type']}"
        
        # 添加选项
        if "options" in data and data["options"]:
            for i, option in enumerate(data["options"]):
                # 修复选项不完整的问题，特殊处理第9题的D选项
                if "教师是最直接的教育者，对受教育者知识、技能、思想、品德等方面的发展起着很大的作" in option and not option.endswith("用"):
                    option = option + "用"
                formatted_question += f"\n{option}"
        
        # 添加答案
        if "answer" in data:
            answer = data["answer"]
            
            # 去除答案中可能包含的题号
            if answer and answer[0].isdigit() and ("." in answer or "," in answer):
                separator = "." if "." in answer else ","
                answer = answer.split(separator, 1)[1].strip()
            
            # 格式化判断题答案
            if data["type"] == "判断题":
                if "√" in answer or "正" in answer:
                    answer = "对"
                elif "×" in answer or "错" in answer:
                    answer = "错"
            # 格式化多选题答案
            elif data["type"] == "多选题":
                # 如果答案是连续的字母（如ABCD），则转换为A,B,C,D格式
                if all(c in "ABCD" for c in answer):
                    answer = ','.join(answer)
            
            formatted_question += f"\n正确答案:{answer}"
        
        # 添加解析，清理解析中的多余内容
        if "explanation" in data:
            explanation = data["explanation"]
            # 提取【解析】和之后的内容，移除所有解析标记
            explanation = re.sub(r'【\s*解析\s*】', '', explanation)
            explanation = re.sub(r'\[\s*解析\s*\]', '', explanation)
            # 清理解析中的多余标记
            explanation = re.sub(r'二、多项选择题.*$', '', explanation)
            explanation = re.sub(r'三、判断题.*$', '', explanation)
            # 清理多余的空格和换行
            explanation = re.sub(r'\s+', ' ', explanation).strip()
            # 清理解析中的"故 A 项正确"等表述
            explanation = re.sub(r'故\s+[ABCD]\s+项(正确|错误|不选)', '', explanation)
            explanation = re.sub(r'故\s+[ABCD][ABCD]\s+两项(符合题意|不选)', '', explanation)
            explanation = re.sub(r'所以答案选\s+[A-D、]+\s+项\s+。', '', explanation)
            explanation = re.sub(r'所以\s+[ABCD][ABCD][ABCD][ABCD]\s+四项均正确。', '', explanation)
            # 清理引用出处
            explanation = re.sub(r'\(具体内容可参看.*\)', '', explanation).strip()
            # 清理多余的句号
            explanation = re.sub(r'。\s*。+', '。', explanation)
            # 移除句子开头的空格
            explanation = re.sub(r'^\s+', '', explanation)
            # 移除多余空格
            explanation = re.sub(r'\s{2,}', ' ', explanation)
            
            formatted_question += f"\n解析:{explanation}"
        
        questions.append(formatted_question)
    
    return questions

if __name__ == '__main__':
    process_file('tm.txt', 'converted_questions.txt') 