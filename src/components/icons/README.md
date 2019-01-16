# SVG icon component

### Getting Started

First import the `BaseIcon.vue`. All icons are stored here `components/icons`. Import one and put it inside `slot` of the `BaseIcon`.

```vue
<template>
  <div>
    <icon>
      <qrcode-icon/>
    </icon>
  </div>
</template>

<script>
import Icon from '@/components/BaseIcon'
import QrcodeIcon from '@/components/icons/QrcodeIcon'

export default {
  components: {
    Icon,
    QrcodeIcon
  }
}
</script>
```

### Examples

Using as a component:

```vue
<icon title="QR Code">
  <qrcode-icon/>
</icon>
```

Using custom SVG content:

```vue
<icon title="Custom SVG Markup" color="red">
  <rect x="0" y="0" width="512" height="512"/>
</icon>
```

Display (title) on hover:

```vue
<icon title="QR Code Lense">
  <qrcode-lense-icon/>
</icon>
```

Using `color, width, height`:

```vue
<icon color="#000" width="128" height="128">
  <qrcode-icon/>
</icon>
```

Property `viewBox` https://developer.mozilla.org/ru/docs/Web/SVG/Attribute/viewBox

```vue
<icon viewBox="0 0 64 64">
  <qrcode-icon/>
</icon>
```
