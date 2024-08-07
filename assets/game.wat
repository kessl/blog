(module
  ;; two buffers, one for current and one for the next generation + "heap" space
  (memory (export "memory") 3)
  (global $page_size (export "page_size") i32 (i32.const 65_536))
  (global $cell_size (export "cell_size") i32 (i32.const 4))

  (global $cols (export "cols") i32 (i32.const 160))
  (global $rows (export "rows") i32 (i32.const 100))

  (global $current_gen_offset (export "offset") (mut i32) (i32.const 0))
  (global $next_gen_offset (mut i32) (i32.const 65_536))
  (func $switch_buffers
    (global.set $current_gen_offset (select (i32.const 0) (global.get $page_size) (global.get $current_gen_offset)))
    (global.set $next_gen_offset (select (i32.const 0) (global.get $page_size) (global.get $next_gen_offset)))
  )

  (func $coords_to_idx (param $x i32) (param $y i32) (result i32)
    ;; (y * cols + x) * cell_size
    (i32.mul (i32.add (local.get $x) (i32.mul (local.get $y) (global.get $cols))) (global.get $cell_size))
  )

  (func $idx_to_x_coord (param $idx i32) (result i32)
    ;; (idx / cell_size) % cols
    (i32.rem_u (i32.div_u (local.get $idx) (global.get $cell_size)) (global.get $cols))
  )

  (func $idx_to_y_coord (param $idx i32) (result i32)
    ;; (idx / cell_size) / cols
    (i32.div_u (i32.div_u (local.get $idx) (global.get $cell_size)) (global.get $cols))
  )

  (func $load_coords (param $x i32) (param $y i32) (result i32)
    (if (i32.lt_s (local.get $x) (i32.const 0)) (then (return (i32.const 0))))
    (if (i32.lt_s (local.get $y) (i32.const 0)) (then (return (i32.const 0))))

    (i32.load (i32.add (global.get $current_gen_offset) (call $coords_to_idx (local.get $x) (local.get $y))))
  )

  (func $is_alive (param $x i32) (param $y i32) (result i32)
    (select (i32.const 1) (i32.const 0) (call $load_coords (local.get $x) (local.get $y)))
  )

  (func $count_neighbors (param $x i32) (param $y i32) (result i32)
    (local $count i32)
    (local.set $count (i32.const 0))

    ;; odd columns are offset by 1/2 tile in a hex grid
    ;; odd column:  (-1, 0), (-1, 1), (0, -1), (0, 1), (1, 0), (1, 1)
    ;; even column: (-1, -1), (-1, 0), (0, -1), (0, 1), (1, -1), (1, 0)
    (if (i32.eq (i32.rem_u (local.get $x) (i32.const 2)) (i32.const 1))
      (then
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const -1)) (local.get $y))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const 1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (local.get $x) (i32.add (local.get $y) (i32.const -1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (local.get $x) (i32.add (local.get $y) (i32.const 1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const 1)) (local.get $y))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const 1)))))
      )
      (else
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const -1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const -1)) (local.get $y))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (local.get $x) (i32.add (local.get $y) (i32.const -1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (local.get $x) (i32.add (local.get $y) (i32.const 1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const -1)))))
        (local.set $count (i32.add (local.get $count) (call $is_alive (i32.add (local.get $x) (i32.const 1)) (local.get $y))))
      )
    )
    (local.get $count)
  )

  (func $heap_get_i32 (param $index i32) (result i32)
    (i32.load
      (i32.add
        (i32.add (global.get $page_size) (global.get $page_size))
        (i32.mul (local.get $index) (global.get $cell_size))
      )
    )
  )

  (func $heap_set_i32 (param $index i32) (param $value i32)
    (i32.store
      (i32.add
        (i32.add (global.get $page_size) (global.get $page_size))
        (i32.mul (local.get $index) (global.get $cell_size))
      )
      (local.get $value)
    )
  )

  (func $ancestry_color (param $x i32) (param $y i32) (result i32)
    ;; when a cell is born (neighbors == 2), make its color the average of its ancestors
    (local $i i32)
    (local $acc_r i32)
    (local $acc_g i32)
    (local $acc_b i32)
    (local $neighbor_color i32)
    (local $neighbor_count i32)

    (if (i32.eq (i32.rem_u (local.get $x) (i32.const 2)) (i32.const 1))
      (then
        (call $heap_set_i32 (i32.const 0) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (local.get $y)))
        (call $heap_set_i32 (i32.const 1) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const 1))))
        (call $heap_set_i32 (i32.const 2) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const -1))))
        (call $heap_set_i32 (i32.const 3) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const 1))))
        (call $heap_set_i32 (i32.const 4) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (local.get $y)))
        (call $heap_set_i32 (i32.const 5) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const 1))))
      )
      (else
        (call $heap_set_i32 (i32.const 0) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (i32.add (local.get $y) (i32.const -1))))
        (call $heap_set_i32 (i32.const 1) (call $load_coords (i32.add (local.get $x) (i32.const -1)) (local.get $y)))
        (call $heap_set_i32 (i32.const 2) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const -1))))
        (call $heap_set_i32 (i32.const 3) (call $load_coords (local.get $x) (i32.add (local.get $y) (i32.const 1))))
        (call $heap_set_i32 (i32.const 4) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (i32.add (local.get $y) (i32.const -1))))
        (call $heap_set_i32 (i32.const 5) (call $load_coords (i32.add (local.get $x) (i32.const 1)) (local.get $y)))
      )
    )

    (local.set $i (i32.const 0))
    (local.set $acc_r (i32.const 0))
    (local.set $acc_g (i32.const 0))
    (local.set $acc_b (i32.const 0))
    (local.set $neighbor_count (i32.const 0))
    (loop $neighbors
      (local.set $neighbor_color (call $heap_get_i32 (local.get $i)))
      (if (i32.gt_u (local.get $neighbor_color) (i32.const 0))
        (then
          (local.set $neighbor_count (i32.add (local.get $neighbor_count) (i32.const 1)))
          (local.set $acc_r (i32.add (local.get $acc_r) (i32.and (local.get $neighbor_color) (i32.const 0x000000ff))))
          (local.set $acc_g (i32.add (local.get $acc_g) (i32.and (local.get $neighbor_color) (i32.const 0x0000ff00))))
          (local.set $acc_b (i32.add (local.get $acc_b) (i32.and (local.get $neighbor_color) (i32.const 0x00ff0000))))
        )
      )

      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $neighbors (i32.lt_u (local.get $i) (i32.const 6))) ;; 6 neighbor spaces
    )

    (local.set $acc_r (i32.and (i32.div_u (local.get $acc_r) (local.get $neighbor_count)) (i32.const 0x000000ff)))
    (local.set $acc_g (i32.and (i32.div_u (local.get $acc_g) (local.get $neighbor_count)) (i32.const 0x0000ff00)))
    (local.set $acc_b (i32.and (i32.div_u (local.get $acc_b) (local.get $neighbor_count)) (i32.const 0x00ff0000)))
    (i32.add (i32.add (local.get $acc_r) (local.get $acc_g)) (local.get $acc_b))
  )

  (func (export "next_gen")
    (local $i i32)
    (local $x i32)
    (local $y i32)
    (local $current_state i32)
    (local $neighbors i32)

    (memory.fill (global.get $next_gen_offset) (i32.const 0) (global.get $page_size))

    (local.set $i (i32.const 0))
    (loop $world
      (local.set $x (call $idx_to_x_coord (local.get $i)))
      (local.set $y (call $idx_to_y_coord (local.get $i)))

      (local.set $current_state (call $load_coords (local.get $x) (local.get $y)))
      (local.set $neighbors (call $count_neighbors (local.get $x) (local.get $y)))

      (block $rules
        (if (i32.and (i32.eq (local.get $neighbors) (i32.const 2)) (i32.eq (local.get $current_state) (i32.const 0)))
          (then
            (i32.store (i32.add (global.get $next_gen_offset) (local.get $i)) (call $ancestry_color (local.get $x) (local.get $y)))
            (br $rules)
          )
        )
        (if (i32.or (i32.eq (local.get $neighbors) (i32.const 3)) (i32.eq (local.get $neighbors) (i32.const 5)))
          (then (i32.store (i32.add (global.get $next_gen_offset) (local.get $i)) (local.get $current_state)))
        )
      )

      (local.set $i (i32.add (local.get $i) (global.get $cell_size)))
      (br_if $world (i32.lt_u (local.get $i) (i32.mul (global.get $cell_size) (i32.mul (global.get $cols) (global.get $rows)))))
    )

    (call $switch_buffers)
  )
)
