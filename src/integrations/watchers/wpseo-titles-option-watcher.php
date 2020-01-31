<?php
/**
 * Watcher for the wpseo_titles option to save the meta data to the indexables table.
 *
 * @package Yoast\YoastSEO\Watchers
 */

namespace Yoast\WP\SEO\Integrations\Watchers;

use Yoast\WP\SEO\Builders\Indexable_Builder;
use Yoast\WP\SEO\Conditionals\Migrations_Conditional;
use Yoast\WP\SEO\Integrations\Integration_Interface;
use Yoast\WP\SEO\Repositories\Indexable_Repository;

/**
 * Watches the wpseo_titles option to save the meta data to the indexables table.
 */
class WPSEO_Titles_Option_Watcher implements Integration_Interface {

	/**
	 * @inheritdoc
	 */
	public static function get_conditionals() {
		return [ Migrations_Conditional::class ];
	}

	/**
	 * @var Indexable_Repository
	 */
	protected $repository;

	/**
	 * @var Indexable_Builder
	 */
	protected $builder;

	/**
	 * WPSEO_Titles_Option_Watcher constructor.
	 *
	 * @param Indexable_Repository $repository The repository to use.
	 * @param Indexable_Builder    $builder    The post builder to use.
	 */
	public function __construct( Indexable_Repository $repository, Indexable_Builder $builder ) {
		$this->repository = $repository;
		$this->builder    = $builder;
	}

	/**
	 * @inheritdoc
	 */
	public function register_hooks() {
		add_action( 'update_option_wpseo_titles', [ $this, 'check_pt_archive_option' ], 10, 2 );
	}

	/**
	 * Checks if post type archive indexables need to be rebuilt based on the wpseo_titles option values.
	 *
	 * @param array $old_value The old value of the option.
	 * @param array $new_value The new value of the option.
	 *
	 * @return void
	 */
	public function check_pt_archive_option( $old_value, $new_value ) {
		$relevant_keys = [ 'title-ptarchive-', 'metadesc-ptarchive-', 'bctitle-ptarchive-', 'noindex-ptarchive-' ];

		if ( ! is_array( $old_value ) || ! is_array( $new_value ) ) {
			return;
		}

		$keys               = array_unique( array_merge( array_keys( $old_value ), array_keys( $new_value ) ) );
		$post_types_rebuild = [];

		foreach ( $keys as $key ) {
			$post_type = false;
			// Check if it's a key relevant to post type archives.
			foreach ( $relevant_keys as $relevant_key ) {
				if ( strpos( $key, $relevant_key ) === 0 ) {
					$post_type = substr( $key, strlen( $relevant_key ) );
					break;
				}
			}

			// If it's not a relevant key or both values aren't set they haven't changed.
			if ( $post_type === false || ( ! isset( $old_value[ $key ] ) && ! isset( $new_value[ $key ] ) ) ) {
				continue;
			}

			// If the value was set but now isn't, is set but wasn't or is not the same it has changed.
			if (
				! in_array( $post_type, $post_types_rebuild, true ) &&
				(
					! isset( $old_value[ $key ] ) ||
					! isset( $new_value[ $key ] ) ||
					$old_value[ $key ] !== $new_value[ $key ]
				)
			) {
				$this->build_pt_archive_indexable( $post_type );
				$post_types_rebuild[] = $post_type;
			}
		}
	}

	/**
	 * Saves the post type archive indexable.
	 *
	 * @param string $post_type The post type.
	 *
	 * @return void
	 */
	public function build_pt_archive_indexable( $post_type ) {
		$indexable = $this->repository->find_for_post_type_archive( $post_type, false );
		$indexable = $this->builder->build_for_post_type_archive( $post_type, $indexable );
		$indexable->save();
	}
}
