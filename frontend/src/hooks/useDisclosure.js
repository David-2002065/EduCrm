import { useState } from 'react'

/**
 * Oyna ochish/yopish + qaysi element uchun ochilgani.
 * const edit = useDisclosure(); edit.open(student); edit.item; edit.close()
 */
export function useDisclosure() {
  const [state, setState] = useState({ isOpen: false, item: null })
  return {
    isOpen: state.isOpen,
    item: state.item,
    open: (item = null) => setState({ isOpen: true, item }),
    close: () => setState((s) => ({ ...s, isOpen: false })),
  }
}
