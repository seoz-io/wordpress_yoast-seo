<?php
/**
 * Yoast SEO plugin file.
 *
 * @package Yoast\YoastSEO\Conditionals
 */

namespace Yoast\WP\SEO\Conditionals;

use Yoast\WP\SEO\Helpers\Options_Helper;
use Yoast\WP\SEO\Helpers\Post_Helper;

/**
 * Conditional that is only met when in the admin.
 */
class Metabox_Enabled_Conditional implements Conditional {

	/**
	 * Holds the options helper.
	 *
	 * @var \Yoast\WP\SEO\Helpers\Options_Helper
	 */
	protected $options;

	/**
	 * Holds the post helper.
	 *
	 * @var \Yoast\WP\SEO\Helpers\Post_Helper
	 */
	protected $post;

	public function __construct( Options_Helper $options, Post_Helper $post ) {
		$this->options = $options;
		$this->post    = $post;
	}

	/**
	 * Returns whether or not this conditional is met.
	 *
	 * @return boolean Whether or not the conditional is met.
	 */
	public function is_met() {
		return $this->options->get( 'display-metabox-pt-' . $this->post->get_post_type(), false );
	}
}
