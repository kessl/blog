(module
  (import "console" "log" (func $log1 (param i32)))
  (import "console" "log" (func $log2 (param i32) (param i32)))

  (memory (export "memory") 2)
  (global $page_size (export "page_size") i32 (i32.const 65_536))

  (global $cols (export "cols") i32 (i32.const 128))
  (global $rows (export "rows") i32 (i32.const 64))

  ;; two buffers, one for current and one for the next generation
  (global $current_gen_offset (export "offset") (mut i32) (i32.const 0))
  (global $next_gen_offset (export "next_offset") (mut i32) (i32.const 65_536))
  (func $switch_buffers
    (global.set $current_gen_offset (select (i32.const 0) (global.get $page_size) (global.get $current_gen_offset)))
    (global.set $next_gen_offset (select (i32.const 0) (global.get $page_size) (global.get $next_gen_offset)))
  )

  (func $coords_to_idx (param $x i32) (param $y i32) (result i32)
    (i32.add (local.get $x) (i32.mul (local.get $y) (global.get $cols)))
  )

  (func $idx_to_x_coord (param $idx i32) (result i32)
    (i32.rem_u (local.get $idx) (global.get $cols))
  )

  (func $idx_to_y_coord (param $idx i32) (result i32)
    (i32.div_u (local.get $idx) (global.get $cols))
  )


  (func $load_coords (param $x i32) (param $y i32) (result i32)
    (if (i32.lt_s (local.get $x) (i32.const 0)) (then (return (i32.const 0))))
    (if (i32.lt_s (local.get $y) (i32.const 0)) (then (return (i32.const 0))))

    (i32.load8_u
      (i32.add
        (global.get $current_gen_offset)
        (call $coords_to_idx (local.get $x) (local.get $y))
      )
    )
  )

  (func $count_neighbors (param $x i32) (param $y i32) (result i32)
    (local $count i32)
    (local.set $count (i32.const 0))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const -1)))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (local.get $y))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const 1)))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const -1)))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const 1)))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const -1)))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (local.get $y))))
    (local.set $count (i32.add (local.get $count) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const 1)))))
    local.get $count
  )

  (func (export "next_gen")
    (local $i i32)
    (local $x i32)
    (local $y i32)
    (local $current_state i32)
    (local $neighbors i32)

    (memory.fill (global.get $next_gen_offset) (i32.const 0) (global.get $page_size))

    (local.set $i (i32.const 0))
    (loop $loop_i
      (local.set $x (call $idx_to_x_coord (local.get $i)))
      (local.set $y (call $idx_to_y_coord (local.get $i)))

      (local.set $current_state (call $load_coords (local.get $x) (local.get $y)))
      (local.set $neighbors (call $count_neighbors (local.get $x) (local.get $y)))

;;      (call $log2 (local.get $x) (local.get $y))
;;      (call $log2 (local.get $current_state) (local.get $neighbors))

      (block $rules
        (if (i32.eq (local.get $neighbors) (i32.const 2))
          (then
            (i32.store8 (i32.add (global.get $next_gen_offset) (local.get $i)) (local.get $current_state))
            br $rules
          )
        )
        (if (i32.eq (local.get $neighbors) (i32.const 3))
          (then
            (i32.store8 (i32.add (global.get $next_gen_offset) (local.get $i)) (i32.const 1))
            br $rules
          )
        )
        (i32.store8 (i32.add (global.get $next_gen_offset) (local.get $i)) (i32.const 0))
      )

      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $loop_i (i32.lt_u (local.get $i) (i32.mul (global.get $cols) (global.get $rows))))
    )

    (call $switch_buffers)
  )
)
