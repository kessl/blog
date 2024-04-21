(module
  (import "console" "log" (func $log1 (param i32)))
  (import "console" "log" (func $log2 (param i32) (param i32)))

  (memory (export "memory") 2)
  (global $page_size i32 (i32.const 65_536))

  (global $cols (export "cols") i32 (i32.const 128))
  (global $rows (export "rows") i32 (i32.const 64))

  ;; two buffers, one for current and one for the next generation
  (global $offset (export "offset") (mut i32) (i32.const 0))
  (func $switch_gen
    (global.set $offset (select (i32.const 0) (global.get $page_size) (global.get $offset)))
    ;; (memory.fill (global.get $offset) (i32.const 0) (global.get $page_size))
  )

  (func $coords_to_idx (param $x i32) (param $y i32) (result i32)
    (i32.add (local.get $x) (i32.mul (local.get $y) (global.get $cols)))
  )

  (func $idx_to_coords (param $idx i32) (result i32 i32)
    (i32.rem_u (local.get $idx) (global.get $cols))
    (i32.div_u (local.get $idx) (global.get $cols))
  )

  (func (export "test") (param $x i32) (param $y i32)
    (local $i i32)

    (call $switch_gen)

    (local.set $i (call $coords_to_idx (local.get $x) (local.get $y)))
    (i32.store (i32.add (global.get $offset) (local.get $i)) (i32.const 1))

    (call $log2 (local.get $x) (local.get $y))
    (call $log1 (local.get $i))
    (call $log2 (call $idx_to_coords (local.get $i)))
  )
)
