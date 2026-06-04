*** Settings ***
Library    SeleniumLibrary

Suite Setup       Open Browser    http://localhost:5173/login    chrome
Suite Teardown    Close Browser

*** Variables ***
${URL_LOGIN}       http://localhost:5173/login
${INPUT_EMAIL}     css=input[type='email']
${INPUT_SENHA}     css=input[type='password']
${BTN_ENTRAR}      css=button[type='submit']
${MSG_ERRO}        xpath=//*[@role='status' and contains(., 'Credenciais inválidas')]

*** Test Cases ***
CT01 - Login com senha errada deve exibir mensagem de erro
    Maximize Browser Window
    Input Text        ${INPUT_EMAIL}    idoso@teste.com
    Input Password    ${INPUT_SENHA}    senhaerrada
    Click Button      ${BTN_ENTRAR}
    Wait Until Page Contains Element    ${MSG_ERRO}    timeout=5s
    Element Should Be Visible           ${MSG_ERRO}
