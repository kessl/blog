(module
  (memory (export "memory") 2)

  ;; two buffers for current and next generation
  (global $offset (export "offset") (mut i32) (i32.const 0))
  (func $switch_gen
    (global.set $offset (select (i32.const 0) (i32.const 65_536) (global.get $offset)))
  )

  (func (export "test") (param $i i32)
    (call $switch_gen)

    (i32.store (i32.add (global.get $offset) (local.get $i)) (i32.const 1))

    ;; (memory.fill (i32.const 0) (i32.const 0) (i32.const 65_536))
  )


  (func (export "test2")
    (memory.fill (i32.const 0) (i32.const 0) (i32.const 65_536))
    (memory.fill (i32.const 65_536) (i32.const 0) (i32.const 65_536))
  )
)
