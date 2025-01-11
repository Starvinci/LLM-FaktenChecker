# backend/app/faktencheck.py

from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage, HumanMessage
from dotenv import load_dotenv
import os
import json
import re
import logging

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

# Konfiguriere das Logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class Faktencheck:
    def __init__(self):
        # Initialisiere das LLM
        self.llm = ChatOpenAI(
            model_name="gpt-4o",  # Überprüfen Sie den Modellnamen. Korrigiert von "gpt-4o" zu "gpt-4"
            temperature=0,
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

        # Initialisiere das Web-Tool für die Suche
        self.web_tool = TavilySearchResults(
            max_results=5,
            tavily_api_key=os.getenv("TAVILY_API_KEY")
        )

        # Tools für den Agenten
        self.tools = [self.web_tool]

        # Definiere den benutzerdefinierten Prompt für den Agenten
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "Du bist ein reflektierender Faktenchecker-Agent im Jahr 2025. Deine Aufgabe ist es, die Wahrheit der folgenden Aussage zu überprüfen. "
                "Gehe systematisch vor, indem du zunächst nachdenkst (Gedanken), dann handelst (Aktion), und schließlich deine Erkenntnisse reflektierst (Reflexion). "
                "Wiederhole diesen Prozess, bis eine fundierte Entscheidung getroffen werden kann. Nutze das Tool 'tavily_search_results_json', um Informationen zu sammeln. "
                "Wenn es unterschiedliche Meinungen gibt, sammle zusätzliche Daten und wäge die Glaubwürdigkeit der Quellen sorgfältig ab. "
                "Deine finale Ausgabe muss ein JSON-Objekt sein mit den Feldern: 'Einschätzung', 'Erklärung', und 'Links'. Die EInschätzung darf immer nur ein Wort sein wie Wahr, Falsch, Übertrieben, Unklar, usw. und bei einer Falschen aussage ist die gesammte aussage falsch"
                "Die Erklärung fasst die Ergebnisse zusammen, und 'Links' enthält eine Liste der verwendeten Quellen ohne zusätzliche Beschreibungen. Verwende mindestens 3 Quellen für eine Aussage und die links müssen Funktionieren und passen. "
                "Stelle sicher, dass nur das JSON-Objekt ausgegeben wird, ohne zusätzliche Texte oder Codeblöcke."
            )),
            ("human", "{input} \n Bitte liefere die finale Antwort im JSON-Format."),
            ("placeholder", "{agent_scratchpad}")
        ])

        # Initialisiere den Agenten
        self.agent = create_openai_tools_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )

        # Initialisiere den AgentExecutor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True
        )

    def check(self, statement):
        """
        Überprüft die Aussage mithilfe des Agenten.
        Gibt ein Python-Dictionary zurück.
        """
        try:
            # Starte die Agentenausführung mit HumanMessage als Eingabe
            result = self.agent_executor.invoke({
                "input": HumanMessage(content=statement),
                "chat_history": []
            })

            # Logge die gesamte Agentenantwort für Debugging-Zwecke
            logging.debug(f"Agent Response: {result}")

            # Extrahiere die finale Antwort aus dem 'output'-Feld
            final_answer = result.get("output", "").strip()

            if final_answer:
                logging.debug(f"Final Answer Found: {final_answer}")

                # Versuche, das JSON innerhalb von ```json ... ``` zu extrahieren
                json_match = re.search(r"```json\s*(\{.*?\})\s*```", final_answer, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    logging.debug("JSON innerhalb von Codeblöcken gefunden.")
                else:
                    # Falls keine Codeblöcke vorhanden sind, versuche, das JSON direkt zu extrahieren
                    # Suche nach dem ersten '{' und dem letzten '}'
                    json_start = final_answer.find('{')
                    json_end = final_answer.rfind('}')
                    if json_start != -1 and json_end != -1:
                        json_str = final_answer[json_start:json_end+1]
                        logging.debug("JSON direkt extrahiert ohne Codeblöcke.")
                    else:
                        raise ValueError("Kein gültiges JSON-Format in der finalen Antwort gefunden.")

                # Parse das JSON aus der finalen Antwort
                parsed_answer = json.loads(json_str)

                # Extrahiere die Links, um sicherzustellen, dass nur URLs enthalten sind
                links = [link for link in parsed_answer.get("Links", []) if isinstance(link, str)]

                # Formatiere das Ergebnis in einem Python-Dictionary für reaktive Frontends
                final_result = {
                    "status": "success",
                    "data": {
                        "Aussage": statement,
                        "Einschätzung": parsed_answer.get("Einschätzung", "Nicht einschätzbar"),
                        "Erklärung": parsed_answer.get("Erklärung", "Keine Erklärung verfügbar."),
                        "Links": links
                    }
                }
                return final_result
            else:
                raise ValueError("Keine finale Antwort im erwarteten Format gefunden.")

        except Exception as e:
            logging.error(f"Fehler bei der Überprüfung der Aussage: {e}")
            error_result = {
                "status": "error",
                "message": str(e)
            }
            return error_result
