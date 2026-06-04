*** Settings ***
Library    SeleniumLibrary

Suite Setup       Open Browser    http://localhost:5173/login    chrome
Suite Teardown    Close Browser

*** Variables ***
${URL_LOGIN}       http://localhost:5173/login
${INPUT_EMAIL}     css=input[type='email']
${INPUT_SENHA}     css=input[type='password']
${BTN_ENTRAR}      css=button[type='submit']

*** Test Cases ***
CT01 - Login com ambos os campos vazios nao deve submeter o formulario
    Maximize Browser Window
    Clear Element Text    ${INPUT_EMAIL}
    Clear Element Text    ${INPUT_SENHA}
    Click Button          ${BTN_ENTRAR}
    Page Should Contain Element    ${INPUT_EMAIL}
    Location Should Be    ${URL_LOGIN}

CT02 - Login apenas com email preenchido nao deve submeter o formulario
    Reload Page
    Input Text            ${INPUT_EMAIL}    idoso@teste.com
    Clear Element Text    ${INPUT_SENHA}
    Click Button          ${BTN_ENTRAR}
    Page Should Contain Element    ${INPUT_EMAIL}
    Location Should Be    ${URL_LOGIN}

CT03 - Login apenas com senha preenchida nao deve submeter o formulario
    Reload Page
    Clear Element Text    ${INPUT_EMAIL}
    Input Password        ${INPUT_SENHA}    123456
    Click Button          ${BTN_ENTRAR}
    Page Should Contain Element    ${INPUT_EMAIL}
    Location Should Be    ${URL_LOGIN}
