import streamlit as st

st.set_page_config(layout="wide")

col1, col2, col3 = st.columns(3)

if 'page' not in st.session_state:
    st.session_state['page'] = 'home'

def switch_to_profile():
    st.session_state['page'] = 'profile'

def switch_to_home():
    st.session_state['page'] = 'home'

if st.session_state['page'] == 'home':
    st.title("Merhaba!")
    # Using keys stores the values in st.session_state automatically
    st.text_input("Adınız:", key="name")
    st.text_input("Soyadınız:", key="surname")
    
    st.button("Gönder", on_click=switch_to_profile)

elif st.session_state['page'] == 'profile':
    # Access the stored values using the keys
    with col2:
        st.write("Merhaba!", st.session_state['name'], st.session_state['surname'])
        st.image("https://upload.wikimedia.org/wikipedia/en/9/96/Meme_Man_on_transparent_background.webp")
        
        st.link_button("öylesine hiçbir işe yaramayan bir buton", "https://youtube.com/shorts/Ix2KXqSMsTQ?si=ea1JKgxkOZ5vnXxC")
