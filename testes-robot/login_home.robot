*** Settings ***
Library    SeleniumLibrary

Suite Setup    Open Browser    http://localhost:5173/login    chrome
Suite Teardown    Close Browser

*** Variables ***
${TITULO}          xpath=//h1[contains(text(),'Daily Check-in')]
${INPUT_EMAIL}     css=input[type='email']
${INPUT_SENHA}     css=input[type='password']
${BTN_ENTRAR}      css=button[type='submit']

*** Test Cases ***
CT01 - Pagina de login deve carregar com todos os elementos
    Maximize Browser Window
    Wait Until Element Is Visible    ${TITULO}    timeout=5s
    Element Should Be Visible    ${TITULO}
    Element Should Be Visible    ${INPUT_EMAIL}
    Element Should Be Visible    ${INPUT_SENHA}
    Element Should Be Visible    ${BTN_ENTRAR}
    Element Should Be Enabled    ${BTN_ENTRAR}