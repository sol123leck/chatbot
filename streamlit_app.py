import streamlit as st
from groq import Groq

st.title("💬 Shadow Studio — Assistant IA")
st.write("Assistant alimenté par Groq (gratuit). Obtenez votre clé sur console.groq.com")

api_key = st.text_input("Clé API Groq", type="password")
if not api_key:
    st.info("Entrez votre clé API Groq pour commencer.", icon="🗝️")
else:
    client = Groq(api_key=api_key)

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input("Votre message..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            stream = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=st.session_state.messages,
                stream=True,
            )
            response = st.write_stream(
                chunk.choices[0].delta.content or ""
                for chunk in stream
                if chunk.choices[0].delta.content
            )

        st.session_state.messages.append({"role": "assistant", "content": response})
