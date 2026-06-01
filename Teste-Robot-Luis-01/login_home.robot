*** Settings ***
Library    SeleniumLibrary

Suite Setup    Open Browser    http://localhost:5173/login    chrome
Suite Teardown    Close Browser

*** Variables ***
${URL_HOME}        http://localhost:5173/
${TITULO}          xpath=//h1[contains(text(),'Daily Check-in')]
${INPUT_EMAIL}     css=input[type='email']
${INPUT_SENHA}     css=input[type='password']
${BTN_ENTRAR}      css=button[type='submit']

*** Test Cases ***
CT01 - Login valido deve redirecionar para Home e exibir titulo
    Maximize Browser Window
    Input Text    ${INPUT_EMAIL}    idoso@teste.com
    Input Password    ${INPUT_SENHA}    123456
    Click Button    ${BTN_ENTRAR}
    Wait Until Location Is    ${URL_HOME}    timeout=5s
    Wait Until Element Is Visible    ${TITULO}    timeout=5s
    Element Should Be Visible    ${TITULO}