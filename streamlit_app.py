import streamlit as st
import anthropic

st.title("💬 Shadow Studio — Assistant IA")
st.write("Posez vos questions à notre assistant. Vous aurez besoin d'une clé API Anthropic (claude.ai/api).")

api_key = st.text_input("Clé API Anthropic", type="password")
if not api_key:
    st.info("Entrez votre clé API Anthropic pour commencer.", icon="🗝️")
else:
    client = anthropic.Anthropic(api_key=api_key)

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
            with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                messages=st.session_state.messages,
            ) as stream:
                response = st.write_stream(stream.text_stream)

        st.session_state.messages.append({"role": "assistant", "content": response})
