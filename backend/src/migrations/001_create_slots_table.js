/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('slots', (table) => {
    table.string('id').primary();
    table.string('start_time').notNullable();
    table.string('end_time').notNullable();
    table.integer('day_of_week').notNullable();
    table.date('date').notNullable();
    table.boolean('is_recurring').defaultTo(false);
    table.string('exception_id').nullable();
    table.timestamps(true, true);
    
    // Add unique constraint to prevent duplicate slots on same date/time
    table.unique(['date', 'start_time', 'end_time']);
    
    // Better indexes
    table.index(['date', 'is_recurring']);
    table.index(['day_of_week', 'is_recurring']);
    table.index(['exception_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('slots');
};