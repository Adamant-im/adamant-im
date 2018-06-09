<template>
  <md-layout
    md-flex="90"
    md-flex-xsmall="85"
    class="chat_message md-whiteframe md-whiteframe-1dp"
    :data-confirmation="confirm"
    v-bind:class="{
      'md-flex-xsmall-offset-10': direction === 'from',
      'md-own md-flex-xsmall-offset-5': direction === 'to'
    }"
  >
    <span class="avatar-holder"></span>
    <span class="msg-holder">
      <slot></slot>
    </span>
    <div class="dt">{{ timestamp }}</div>
  </md-layout>
</template>

<script>
  export default {
    name: 'chat-entry-template',
    props: ['confirm', 'direction', 'timestamp']
  }
</script>

<style>
  .chat_message p {
    margin: 0;
    padding: 5px 0;

    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    /* This is the dangerous one in WebKit, as it breaks things wherever */
    word-break: break-all;
    /* Instead use this non-standard one: */
    word-break: break-word;

    /* Adds a hyphen where the word breaks, if supported (No Blink) */
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }

  [data-confirmation=confirmed]:before {
    content: 'done';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=unconfirmed]:before {
    content: 'query_builder';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  [data-confirmation=error]:before {
    content: 'error';
    font-family: "Material Icons";
    text-rendering: optimizeLegibility;
    position: absolute;
    bottom: 0;
    left: 1px;
    font-size: 8px;
  }

  .msg-holder {
    margin-top: -10px;
    margin-left: 2px;
  }

  .msg-holder .transaction-amount {
    font-size: 24px;
    cursor: pointer;
  }

  .chat_message {
    margin-bottom: 20px;
    padding: 25px 10px;

    text-align: left;
    position:relative;
    padding-right: 50px;
    min-height: 0;
  }

  .chat_message .dt {
    position: absolute;
    top: 0;
    right: 5px;
    font-size: 8px;
    font-style: italic;
  }

  .chat_message.md-own {
    margin-left:2.5%;
  }

  .chat_message {
    margin-left:7.5%;
  }

  .chat_messagej:after {
    content: ' ';
    position: absolute;
    width: 0;
    height: 0;
    left: -20px;
    right: auto;
    top: 0px;
    bottom: auto;
    border: 22px solid;
    border-color: #4A4A4A transparent transparent transparent;
  }
</style>
